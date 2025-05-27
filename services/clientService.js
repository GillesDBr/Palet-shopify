
// services/clientService.js
const {findRecordByField, createRecord } = require('../helpers/airtableHelper');
const tables = require('../config/tables');

async function createClient(customer) {
  const name = `${customer.first_name} ${customer.last_name}`;
  const country = await findRecordByField(
    tables.COUNTRIES_TABLE,
    'country code',
    customer.default_address.country_code
  );

  const fields = {
    'Name': name,
    'name extra line': customer.default_address.company,
    'street': customer.default_address.address1,
    'postcode': customer.default_address.zip,
    'city': customer.default_address.city,
    'country': country ? [country.id] : []
  };
  return await createRecord(tables.CLIENTS_TABLE, fields);
}

module.exports = { createClient };