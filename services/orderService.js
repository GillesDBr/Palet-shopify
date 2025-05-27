// services/orderService.js
const { formatDate } = require('../helpers/dateHelper');
const { findRecordByField, createRecord } = require('../helpers/airtableHelper');
const tables = require('../config/tables');
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
    tables.OVERVIEW_TABLE,
    tables.OVERVIEW_FIELD_PERIOD,
    periodKey
  );

  // shipping_lines.title
  // Create or link client record
  const clientLink = await clientService.createClient(order.customer);

// Build order fields
  const orderFields = {
    'Name Project': `${order.order_number} ${order.customer.first_name} ${order.customer.last_name}`,
    'stage': orderType === 100 ? 'webshop curated samples' : orderType === 200 ? 'webshop samples' : 'plan to print',
    'month': overview ? [overview.id] : [],
    'client': clientLink ? [clientLink.id] : [],
    'discount': (parseFloat(order.total_discounts) / parseFloat(order.total_line_items_price)),
    'invoice send': true,
    'paid': true,
    'shipping comments': order.shipping_lines[0].title,
    'shipping price': parseFloat(order.current_shipping_price_set.shop_money.amount),
    'incoterms': 'DAP'
  };
  const orderRec = await createRecord(tables.ORDERS_TABLE, orderFields);

  // Process line items
  for (let item of order.line_items) {
    await lineItemService.processLineItem(item, orderRec.id);
  }

  return orderRec;
}

module.exports = { processOrder };