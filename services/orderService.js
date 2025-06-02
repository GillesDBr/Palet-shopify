// services/orderService.js
const { formatDate } = require('../helpers/dateHelper');
const { findRecordByField, createRecord, addSingleSelectOption } = require('../helpers/airtableHelper');
const { FIELDS, OVERVIEW, ORDERS } = require('../config/tables');
const clientService = require('./clientService');
const lineItemService = require('./lineItemService');
const axios = require('axios');

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

  // Generate the project name
  const projectName = `#${order.order_number} ${order.customer.first_name} ${order.customer.last_name}`;

  // Double-check mechanism for duplicate detection
  async function checkForDuplicate() {
    const existingProject = await findRecordByField(
      ORDERS,
      FIELDS.ORDERS.NAME,
      projectName
    );
    
    if (existingProject) {
      console.log(`Found duplicate project: ${projectName}`);
      return {
        id: existingProject.id,
        fields: existingProject.fields,
        isDuplicate: true
      };
    }
    return null;
  }

  // First check for duplicate
  const duplicate = await checkForDuplicate();
  if (duplicate) return duplicate;

  // Lookup monthly overview record
  const periodKey = formatDate(order.updated_at);
  const overview = await findRecordByField(
    OVERVIEW,
    FIELDS.OVERVIEW.PERIOD,
    periodKey
  );

  // Create or link client record
  const clientLink = await clientService.createClient(order.customer);

  // Get shipping method from shipping lines
  const shippingMethod = order.shipping_lines[0].title;

  // Get discount code if available
  const discountCode = order.discount_applications?.[0]?.title || null;

  // Build initial order fields
  const orderFields = {
    [FIELDS.ORDERS.NAME]: projectName,
    [FIELDS.ORDERS.STAGE]: orderType === 100 ? 'webshop curated samples' : orderType === 200 ? 'webshop samples' : 'plan to print',
    [FIELDS.ORDERS.MONTH]: overview ? [overview.id] : [],
    [FIELDS.ORDERS.CLIENT]: clientLink ? [clientLink.id] : [],
    [FIELDS.ORDERS.DISCOUNT]: parseFloat(order.total_discounts) / parseFloat(order.total_line_items_price),
    [FIELDS.ORDERS.INVOICE_SENT]: true,
    [FIELDS.ORDERS.PAID]: true,
    [FIELDS.ORDERS.SHIPPING_PRICE]: parseFloat(order.current_shipping_price_set.shop_money.amount),
    [FIELDS.ORDERS.INCOTERMS]: 'DAP'
  };

  // Second check for duplicate right before creation
  const lastMinuteDuplicate = await checkForDuplicate();
  if (lastMinuteDuplicate) return lastMinuteDuplicate;

  // Create the initial order record
  const orderRec = await createRecord(ORDERS, orderFields);

  // Update the record with shipping method and discount code
  const updateFields = {
    [FIELDS.ORDERS.SHIPPING_METHOD]: shippingMethod
  };

  if (discountCode) {
    updateFields[FIELDS.ORDERS.DISCOUNT_CODE] = discountCode;
  }

  await axios.patch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${ORDERS}/${orderRec.id}`,
    {
      fields: updateFields,
      typecast: true
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // Process line items
  for (let item of order.line_items) {
    await lineItemService.processLineItem(item, orderRec.id);
  }

  return {
    id: orderRec.id,
    fields: { ...orderFields, ...updateFields },
    isDuplicate: false
  };
}

module.exports = { processOrder };