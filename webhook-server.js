// Express webhook listener
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { processOrder } = require('./services/orderService');
const { formatOrderLog, writeToLog } = require('./helpers/logHelper');

const app = express();
app.use(bodyParser.raw({ type: 'application/json' }));

function verifyHmac(req, res, next) {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_SECRET)
    .update(req.body, 'utf8')
    .digest('base64');
  if (hash !== hmac) return res.status(401).send('HMAC mismatch');
  next();
}

app.post('/webhook', verifyHmac, (req, res) => {
  const order = JSON.parse(req.body.toString());
  processOrder(order)
    .then((rec) => {
      // Check if the response includes isDuplicate flag
      const status = rec.isDuplicate ? 'duplicate' : 'success';
      writeToLog(formatOrderLog(order, rec.id, status));
      res.sendStatus(200);
    })
    .catch(err => {
      writeToLog(formatOrderLog(order, null, 'error') + `Error: ${err.message}\n\n`);
      console.error(err);
      res.sendStatus(500);
    });
});

app.get('/health', (req, res) => res.send('👍 OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
  writeToLog(`[${new Date().toISOString()}] Webhook server started on port ${PORT}\n\n`);
});