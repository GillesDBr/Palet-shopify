require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const { FIELDS, ...TABLES } = require('./config/tables');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Define expected single select options for each field
const EXPECTED_SELECT_OPTIONS = {
    [TABLES.ORDERS]: {
        [FIELDS.ORDERS.STAGE]: ['webshop curated samples', 'webshop samples', 'plan to print'],
        [FIELDS.ORDERS.INCOTERMS]: ['DAP']
    },
    [TABLES.SAMPLE_JOBS]: {
        [FIELDS.SAMPLE_JOBS.STATUS]: ['Todo']
    },
    [TABLES.PRINT_JOBS]: {
        [FIELDS.PRINT_JOBS.STATUS]: ['to-do']
    }
};

// Add debug logging
console.log('Environment Check:');
console.log('API Key exists:', !!AIRTABLE_API_KEY);
console.log('Base ID exists:', !!AIRTABLE_BASE_ID);
console.log('Base ID:', AIRTABLE_BASE_ID);

async function getTableSchema(tableName) {
    const url = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
    console.log(`\nFetching schema from: ${url}`);
    
    try {
        const response = await axios.get(
            url,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // List all available tables
        if (!tableName) {
            console.log('\nAvailable tables in your Airtable base:');
            response.data.tables.forEach(table => {
                console.log(`- "${table.name}"`);
            });
            return null;
        }

        return response.data.tables.find(table => table.name === tableName);
    } catch (error) {
        console.error('Error fetching schema:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Status Text:', error.response.statusText);
            console.error('Airtable response:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

async function updateSingleSelectOptions(baseId, tableId, fieldId, options) {
    const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields/${fieldId}`;
    try {
        const response = await axios.patch(
            url,
            {
                options: {
                    choices: options.map(option => ({ name: option }))
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating single select options:', error.message);
        if (error.response) {
            console.error('Airtable response:', JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
}

async function validateSchema() {
    console.log('🔍 Starting Airtable schema validation...\n');
    
    // First, list all available tables
    await getTableSchema();
    
    let hasErrors = false;

    // Create a mapping of table names to their field configurations
    const tableFieldMap = {
        [TABLES.ORDERS]: FIELDS.ORDERS,
        [TABLES.OVERVIEW]: FIELDS.OVERVIEW,
        [TABLES.CLIENTS]: FIELDS.CLIENTS,
        [TABLES.COUNTRIES]: FIELDS.COUNTRIES,
        [TABLES.SAMPLE_JOBS]: FIELDS.SAMPLE_JOBS,
        [TABLES.PRINT_JOBS]: FIELDS.PRINT_JOBS,
        [TABLES.CURATED_SAMPLES]: FIELDS.CURATED_SAMPLES,
        [TABLES.DESIGNS]: FIELDS.DESIGNS,
        [TABLES.GLAZES]: FIELDS.GLAZES
    };

    // Iterate through each table in our configuration
    for (const [tableName, fields] of Object.entries(tableFieldMap)) {
        console.log(`\nChecking table: "${tableName}"`);
        const schema = await getTableSchema(tableName);
        
        if (!schema) {
            console.error(`❌ Table "${tableName}" not found in Airtable base`);
            hasErrors = true;
            continue;
        }

        // Check each field in our configuration
        for (const [fieldKey, fieldName] of Object.entries(fields)) {
            const field = schema.fields.find(f => f.name === fieldName);
            
            if (!field) {
                console.error(`❌ Missing field: "${fieldName}" in table "${tableName}"`);
                hasErrors = true;
                continue;
            }

            console.log(`✅ Found field: "${fieldName}"`);

            // Check single select options if this field should have them
            if (EXPECTED_SELECT_OPTIONS[tableName]?.[fieldName]) {
                const expectedOptions = EXPECTED_SELECT_OPTIONS[tableName][fieldName];
                const currentOptions = field.options?.choices?.map(c => c.name) || [];
                
                const missingOptions = expectedOptions.filter(opt => !currentOptions.includes(opt));
                
                if (missingOptions.length > 0) {
                    console.log(`⚠️  Missing select options for "${fieldName}": ${missingOptions.join(', ')}`);
                    
                    if (field.type === 'singleSelect') {
                        console.log(`🔄 Adding missing options to "${fieldName}"...`);
                        const allOptions = [...new Set([...currentOptions, ...missingOptions])];
                        const result = await updateSingleSelectOptions(
                            AIRTABLE_BASE_ID,
                            schema.id,
                            field.id,
                            allOptions
                        );
                        if (result) {
                            console.log(`✅ Successfully added options to "${fieldName}"`);
                        } else {
                            console.error(`❌ Failed to add options to "${fieldName}"`);
                            hasErrors = true;
                        }
                    }
                } else {
                    console.log(`✅ All select options present for "${fieldName}"`);
                }
            }
        }
    }

    if (hasErrors) {
        console.log('\n❌ Schema validation failed. Please fix the issues above.');
    } else {
        console.log('\n✅ Schema validation passed! All required fields and options are present.');
    }
}

// Run the validation
validateSchema().catch(console.error); 