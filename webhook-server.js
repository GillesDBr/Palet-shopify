// Express webhook listener
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { processOrder } = require('./services/orderService');

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
    .then(() => res.sendStatus(200))
    .catch(err => {
      console.error(err);
      res.sendStatus(500);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));