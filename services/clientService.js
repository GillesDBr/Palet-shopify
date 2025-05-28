// services/clientService.js
const {findRecordByField, createRecord } = require('../helpers/airtableHelper');
const { FIELDS, COUNTRIES, CLIENTS } = require('../config/tables');

async function createCountryIfNotExists(countryCode, countryName) {
  let country = await findRecordByField(
    COUNTRIES,
    FIELDS.COUNTRIES.COUNTRY_CODE,
    countryCode
  );

  if (!country) {
    // Create new country record if it doesn't exist
    const fields = {
      [FIELDS.COUNTRIES.COUNTRY_CODE]: countryCode,
      'Name': countryName // Adding the country name for better readability in Airtable
    };
    country = await createRecord(COUNTRIES, fields);
  }

  return country;
}

async function createClient(customer) {
  const name = `${customer.first_name} ${customer.last_name}`;
  const countryCode = customer.default_address.country_code;
  const countryName = customer.default_address.country; // Shopify provides country name

  // Create country if it doesn't exist
  const country = await createCountryIfNotExists(countryCode, countryName);

  const fields = {
    [FIELDS.CLIENTS.NAME]: name,
    [FIELDS.CLIENTS.NAME_EXTRA]: customer.default_address.company,
    [FIELDS.CLIENTS.STREET]: customer.default_address.address1,
    [FIELDS.CLIENTS.POSTCODE]: customer.default_address.zip,
    [FIELDS.CLIENTS.CITY]: customer.default_address.city,
    [FIELDS.CLIENTS.COUNTRY]: country ? [country.id] : []
  };
  return await createRecord(CLIENTS, fields);
}

module.exports = { createClient };