// CLI test script
require('dotenv').config({ path: `.env.development` });
const fs = require('fs');
const { processOrder } = require('./services/orderService');
const { formatOrderLog, writeToLog } = require('./helpers/logHelper');

(async () => {
  const raw = fs.readFileSync('testdata.json', 'utf8');
  const order = JSON.parse(raw);
  try {
    const rec = await processOrder(order);
    const status = rec.isDuplicate ? 'duplicate' : 'success';
    writeToLog(formatOrderLog(order, rec.id, status));
  } catch (err) {
    writeToLog(formatOrderLog(order, null, 'error') + `Error: ${err.message}\n\n`);
    process.exit(1);
  }
})();