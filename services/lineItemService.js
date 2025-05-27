// services/lineItemService.js
const { createRecord, findRecordByField } = require('../helpers/airtableHelper');
const tables = require('../config/tables');

async function processLineItem(item, orderId) {
  const sku = item.sku;
  const quantity = item.fulfillable_quantity;

  // extract properties
  let design, colors;
  item.properties.forEach(prop => {
    if (prop.name === 'Design') design = prop.value;
    if (prop.name === 'Colors') colors = prop.value; // e.g. "379+343"
  });
  const [dom, sec] = colors ? colors.replace(/\s+/g, '').split('+') : [];

  if (sku === '200') {
    // sample-jobs
    for (let i = 0; i < quantity; i++) {
      const designRec = await findRecordByField(tables.DESIGN_TABLE, 'Name', design) || {};
      const domRec = await findRecordByField(tables.GLAZES_TABLE, 'ID', dom) || {};
      const secRec = await findRecordByField(tables.GLAZES_TABLE, 'ID', sec) || {};
      const fields = {
        'Status': 'Todo',
        'design': designRec.id ? [designRec.id] : [],
        'glaze dominant': domRec.id ? [domRec.id] : [],
        'glaze secondary': secRec.id ? [secRec.id] : [],
        'projects': [orderId]
      };
      await createRecord(tables.SAMPLE_JOBS_TABLE, fields);
    }
  } else if (sku === '300') {
    // print-jobs
    const designRec = await findRecordByField(tables.DESIGN_TABLE, 'Name', design) || {};
    const domRec = await findRecordByField(tables.GLAZES_TABLE, 'ID', dom) || {};
    const secRec = await findRecordByField(tables.GLAZES_TABLE, 'ID', sec) || {};
    const fields = {
      'status': 'to-do',
      'design': designRec.id ? [designRec.id] : [],
      'glaze dominant': domRec.id ? [domRec.id] : [],
      'glaze secondary': secRec.id ? [secRec.id] : [],
      'sqm': quantity,
      'projects': [orderId]
    };
    await createRecord(tables.PRINT_JOBS_TABLE, fields);
  } else if (sku === '100'){
    // curated sample box
    const fields = {
      'quantity': quantity,
      'projects': [orderId]
    };
    await createRecord(tables.CURATED_SAMPLES_TABLE, fields);
  }
}

module.exports = { processLineItem };