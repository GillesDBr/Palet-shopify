// services/orderService.js
const { formatDate } = require('../helpers/dateHelper');
const { findRecordByField, createRecord } = require('../helpers/airtableHelper');
const { FIELDS, OVERVIEW, ORDERS } = require('../config/tables');
const clientService = require('./clientService');
const lineItemService = require('./lineItemService');

async function processOrder(order) {
  // Determine orderType
  let orderType = 100;
  order.line_items.forEach(item => {
    if (item.sku === '300') {
      orderType = 300;
    } else if (item.sku === '200' && orderType !== 300) {
      orderType = 200;
    }
  });

  // Lookup monthly overview record
  const periodKey = formatDate(order.updated_at);
  const overview = await findRecordByField(
    OVERVIEW,
    FIELDS.OVERVIEW.PERIOD,
    periodKey
  );

  // shipping_lines.title
  // Create or link client record
  const clientLink = await clientService.createClient(order.customer);

// Build order fields
  const orderFields = {
    [FIELDS.ORDERS.NAME]: `#${order.order_number} ${order.customer.first_name} ${order.customer.last_name}`,
    [FIELDS.ORDERS.STAGE]: orderType === 100 ? 'webshop curated samples' : orderType === 200 ? 'webshop samples' : 'plan to print',
    [FIELDS.ORDERS.MONTH]: overview ? [overview.id] : [],
    [FIELDS.ORDERS.CLIENT]: clientLink ? [clientLink.id] : [],
    [FIELDS.ORDERS.DISCOUNT]: (parseFloat(order.total_discounts) / parseFloat(order.total_line_items_price)),
    [FIELDS.ORDERS.INVOICE_SENT]: true,
    [FIELDS.ORDERS.PAID]: true,
    [FIELDS.ORDERS.SHIPPING_COMMENTS]: order.shipping_lines[0].title,
    [FIELDS.ORDERS.SHIPPING_PRICE]: parseFloat(order.current_shipping_price_set.shop_money.amount),
    [FIELDS.ORDERS.INCOTERMS]: 'DAP'
  };
  const orderRec = await createRecord(ORDERS, orderFields);

  // Process line items
  for (let item of order.line_items) {
    await lineItemService.processLineItem(item, orderRec.id);
  }

  return orderRec;
}

module.exports = { processOrder };