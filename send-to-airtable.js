// CLI test script
require('dotenv').config({ path: `.env.development` });
const fs = require('fs');
const { processOrder } = require('./services/orderService');

(async () => {
  const raw = fs.readFileSync('testdata.json', 'utf8');
  const order = JSON.parse(raw);
  try {
    const rec = await processOrder(order);
    console.log('✅ Order created:', rec.id);
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
})();