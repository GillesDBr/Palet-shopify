// services/lineItemService.js
const { createRecord, findRecordByField } = require('../helpers/airtableHelper');
const { FIELDS, DESIGNS, GLAZES, SAMPLE_JOBS, PRINT_JOBS, CURATED_SAMPLES } = require('../config/tables');

async function processLineItem(item, orderId) {
  const sku = item.sku;
  const quantity = item.fulfillable_quantity;

  // extract properties
  let design, colors, imageUrl;
  item.properties.forEach(prop => {
    if (prop.name === 'Design') design = prop.value;
    if (prop.name === 'Colors') colors = prop.value; // e.g. "379+343"
    if (prop.name === 'Image') imageUrl = prop.value;
  });
  const [dom, sec] = colors ? colors.replace(/\s+/g, '').split('+') : [];

  if (sku === '200') {
    // sample-jobs
    for (let i = 0; i < quantity; i++) {
      const designRec = await findRecordByField(DESIGNS, FIELDS.DESIGNS.NAME, design) || {};
      const domRec = await findRecordByField(GLAZES, FIELDS.GLAZES.ID, dom) || {};
      const secRec = await findRecordByField(GLAZES, FIELDS.GLAZES.ID, sec) || {};
      const fields = {
        [FIELDS.SAMPLE_JOBS.STATUS]: 'Todo',
        [FIELDS.SAMPLE_JOBS.DESIGN]: designRec.id ? [designRec.id] : [],
        [FIELDS.SAMPLE_JOBS.GLAZE_DOMINANT]: domRec.id ? [domRec.id] : [],
        [FIELDS.SAMPLE_JOBS.GLAZE_SECONDARY]: secRec.id ? [secRec.id] : [],
        [FIELDS.SAMPLE_JOBS.PROJECTS]: [orderId],
        [FIELDS.SAMPLE_JOBS.PAID]: 'paid',
        [FIELDS.SAMPLE_JOBS.PRODUCT_IMAGE]: imageUrl
      };
      await createRecord(SAMPLE_JOBS, fields);
    }
  } else if (sku === '300') {
    // print-jobs
    const designRec = await findRecordByField(DESIGNS, FIELDS.DESIGNS.NAME, design) || {};
    const domRec = await findRecordByField(GLAZES, FIELDS.GLAZES.ID, dom) || {};
    const secRec = await findRecordByField(GLAZES, FIELDS.GLAZES.ID, sec) || {};
    const fields = {
      [FIELDS.PRINT_JOBS.STATUS]: 'to-do',
      [FIELDS.PRINT_JOBS.DESIGN]: designRec.id ? [designRec.id] : [],
      [FIELDS.PRINT_JOBS.GLAZE_DOMINANT]: domRec.id ? [domRec.id] : [],
      [FIELDS.PRINT_JOBS.GLAZE_SECONDARY]: secRec.id ? [secRec.id] : [],
      [FIELDS.PRINT_JOBS.SQM]: quantity,
      [FIELDS.PRINT_JOBS.PROJECTS]: [orderId],
      [FIELDS.PRINT_JOBS.PRODUCT_IMAGE]: imageUrl
    };
    await createRecord(PRINT_JOBS, fields);
  } else if (sku === '100'){
    // curated sample box
    const fields = {
      [FIELDS.CURATED_SAMPLES.QUANTITY]: quantity,
      [FIELDS.CURATED_SAMPLES.PROJECTS]: [orderId]
    };
    await createRecord(CURATED_SAMPLES, fields);
  }
}

module.exports = { processLineItem };