// helpers/airtableHelper.js
const axios = require('axios');
require('dotenv').config();

const BASE_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;
const AUTH_HEADER = { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` };

async function findRecordByField(table, field, value) {
  const filter = `{${field}}='${value}'`;
  const url = `${BASE_URL}/${encodeURIComponent(table)}?filterByFormula=${encodeURIComponent(filter)}`;
  const resp = await axios.get(url, { headers: { ...AUTH_HEADER, 'Content-Type':'application/json' } });
  return resp.data.records[0] || null;
}

async function createRecord(table, fields) {
  const url = `${BASE_URL}/${encodeURIComponent(table)}`;
  const resp = await axios.post(url, { records: [{ fields }] }, { headers: { ...AUTH_HEADER, 'Content-Type':'application/json' } });
  return resp.data.records[0];
}

module.exports = { findRecordByField, createRecord };