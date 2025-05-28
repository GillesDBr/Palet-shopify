// helpers/airtableHelper.js
const axios = require('axios');
require('dotenv').config();

const BASE_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;
const AUTH_HEADER = { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` };

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

async function findRecordByField(tableName, fieldName, fieldValue) {
  const filter = `{${fieldName}}='${fieldValue}'`;
  const url = `${BASE_URL}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(filter)}`;
  const resp = await axios.get(url, { headers: { ...AUTH_HEADER, 'Content-Type':'application/json' } });
  return resp.data.records[0] || null;
}

async function createRecord(tableName, fields) {
  const url = `${BASE_URL}/${encodeURIComponent(tableName)}`;
  const resp = await axios.post(url, { records: [{ fields }] }, { headers: { ...AUTH_HEADER, 'Content-Type':'application/json' } });
  return resp.data.records[0];
}

module.exports = {
    findRecordByField,
    createRecord
};