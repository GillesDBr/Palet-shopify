// Express webhook listener
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { processOrder } = require('./services/orderService');
const { formatOrderLog, formatWebhookLog, writeToLog } = require('./helpers/logHelper');

const app = express();

// Increase the timeout to handle longer processing
app.use((req, res, next) => {
  // Set timeout to 30 seconds
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});

// Use raw body parser for webhook validation
app.use(bodyParser.raw({ type: 'application/json' }));

// Keep track of processing orders to prevent race conditions
const processingOrders = new Set();

// Sleep function for ensuring response is sent
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function verifyHmac(req, res, next) {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_SECRET)
    .update(req.body, 'utf8')
    .digest('base64');
  if (hash !== hmac) return res.status(401).send('HMAC mismatch');
  next();
}

app.post('/webhook', verifyHmac, async (req, res) => {
  const order = JSON.parse(req.body.toString());
  const orderKey = `${order.order_number}-${order.customer.email}`;

  // Log webhook receipt with timestamp
  const startTime = new Date().toISOString();
  writeToLog(formatWebhookLog(`📥 New webhook received at ${startTime}`, order));

  // If this order is already being processed, return 200 to prevent retries
  if (processingOrders.has(orderKey)) {
    writeToLog(formatWebhookLog(`⚠️ Duplicate webhook detected for order ${orderKey}`, order));
    return res.sendStatus(200);
  }

  // Add order to processing set and send immediate response
  processingOrders.add(orderKey);
  res.sendStatus(200);
  
  // Log response sent
  writeToLog(formatWebhookLog(`📤 Sent 200 response for ${orderKey}`, order));

  // Wait a short time to ensure response is received
  await sleep(1000);

  try {
    writeToLog(formatWebhookLog(`⚙️ Starting order processing for ${orderKey}`, order));
    const rec = await processOrder(order);
    const status = rec.isDuplicate ? 'duplicate' : 'success';
    writeToLog(formatOrderLog(order, rec.id, status));
  } catch (err) {
    writeToLog(formatOrderLog(order, null, 'error') + `Error: ${err.message}\n\n`);
    console.error(err);
  } finally {
    // Remove order from processing set regardless of outcome
    processingOrders.delete(orderKey);
    const endTime = new Date().toISOString();
    writeToLog(formatWebhookLog(`✔️ Webhook processing completed at ${endTime} for ${orderKey}`, order));
  }
});

// Health check endpoint
app.get('/health', (req, res) => res.send('👍 OK'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  writeToLog(`❌ Server error: ${err.message}\n${err.stack}\n`);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  writeToLog(formatWebhookLog(`🚀 Webhook server started on port ${PORT}`));
});