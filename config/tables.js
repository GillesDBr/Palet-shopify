/**
 * Centralized configuration for all Airtable table names and field names.
 * This file serves as a single source of truth for all database field references.
 */

// Table Names - Constants for all Airtable table names
const TABLES = {
  ORDERS: "projects",            // Main table for order management
  OVERVIEW: "monthly overview",  // Monthly statistics and overview
  CLIENTS: "clients",           // Customer information
  COUNTRIES: "countries",       // Country codes and names
  SAMPLE_JOBS: "sample-jobs",   // Individual sample orders
  CURATED_SAMPLES: "curated-samples", // Pre-selected sample boxes
  PRINT_JOBS: "print-jobs",     // Production print orders
  DESIGNS: "designs",           // Available design patterns
  GLAZES: "glazes-blends"      // Available glaze colors and blends
};

// Field Names by Table - Organized mapping of all field names used in each table
const FIELDS = {
  // Orders (projects) table fields - Tracks main order information
  ORDERS: {
    NAME: 'Name Project',         // Unique order identifier with customer name
    STAGE: 'stage',              // Current order status/stage
    MONTH: 'month',              // Link to monthly overview
    CLIENT: 'client',            // Link to client record
    DISCOUNT: 'discount',        // Applied discount percentage
    DISCOUNT_CODE: 'discount code', // Discount code used (if any)
    INVOICE_SENT: 'invoice send', // Invoice status
    PAID: 'paid',                // Payment status
    SHIPPING_METHOD: 'shipping method',  // Shipping carrier and service
    SHIPPING_PRICE: 'shipping price',      // Shipping cost
    INCOTERMS: 'incoterms'       // International commercial terms
  },

  // Overview table fields - Monthly statistics
  OVERVIEW: {
    PERIOD: 'period'             // Time period identifier
  },

  // Clients table fields - Customer information
  CLIENTS: {
    NAME: 'Name',                // Client's full name
    NAME_EXTRA: 'name extra line', // Additional name info (company)
    STREET: 'street',            // Street address
    POSTCODE: 'postcode',        // Postal/ZIP code
    CITY: 'city',               // City name
    COUNTRY: 'country'          // Link to country record
  },

  // Countries table fields - Country reference data
  COUNTRIES: {
    COUNTRY_CODE: 'country code', // ISO country code
    NAME: 'Name'                 // Full country name
  },

  // Sample Jobs table fields - Individual sample orders
  SAMPLE_JOBS: {
    STATUS: 'Status',            // Current sample status
    DESIGN: 'design',           // Link to design record
    GLAZE_DOMINANT: 'glaze dominant',     // Primary glaze color
    GLAZE_SECONDARY: 'glaze secondary',   // Secondary glaze color
    PROJECTS: 'projects'        // Link to main order
  },

  // Print Jobs table fields - Production orders
  PRINT_JOBS: {
    STATUS: 'status',           // Current production status
    DESIGN: 'design',           // Link to design record
    GLAZE_DOMINANT: 'glaze dominant',     // Primary glaze color
    GLAZE_SECONDARY: 'glaze secondary',   // Secondary glaze color
    SQM: 'sqm',                // Square meters ordered
    PROJECTS: 'projects'        // Link to main order
  },

  // Curated Samples table fields - Pre-selected sample boxes
  CURATED_SAMPLES: {
    QUANTITY: 'quantity',       // Number of sample boxes
    PROJECTS: 'projects'        // Link to main order
  },

  // Designs table fields - Available patterns
  DESIGNS: {
    NAME: 'Name'               // Design pattern name
  },

  // Glazes table fields - Available colors
  GLAZES: {
    ID: 'ID'                  // Glaze color identifier
  }
};

module.exports = {
  ...TABLES,
  FIELDS
};