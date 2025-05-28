# to deploy
git add .  
git commit -m "Describe your change"

heroku will build based on github repisitory

to log heroku
heroku logs --tail --app palet-shopify

to check if life
curl https://palet-shopify-9c83296acb03.herokuapp.com/health

to test with local test data
node send-to-airtable.js

# Shopify → Airtable Sync

This project provides a robust, modular Node.js application to:

1. **Receive** webhooks from Shopify (order events).
2. **Process** order data (parse, format, determine types).
3. **Sync** data into an Airtable base—creating and linking records across multiple tables.

## 🔄 Recent Updates

### Field Name Centralization
- All Airtable field names are now centralized in `config/tables.js`
- Organized by table for better maintainability
- Reduces typos and makes field name changes easier
- Better IDE support with autocomplete

### Improved Country Handling
- Automatic creation of missing country records
- Prevents Airtable API errors for new country codes
- Stores both country code and full country name
- Maintains data consistency across tables

---

## 📁 Repository Structure

```
shopify-airtable-sync/
├── .env.development       # Dev environment variables (test base)
├── .env.production        # Prod environment variables (real base)
├── package.json           # NPM metadata & scripts
├── testdata.json          # Sample Shopify webhook payload
│
├── send-to-airtable.js    # CLI script for local testing
├── webhook-server.js      # Express server for real Shopify webhooks
│
├── config/
│   └── tables.js          # Central table & field name constants
│
├── helpers/
│   ├── dateHelper.js      # Date formatting utilities
│   └── airtableHelper.js  # Generic Airtable REST API wrapper
│
└── services/
    ├── orderService.js    # Orchestrates full order workflow
    ├── clientService.js   # Create or link client records
    └── lineItemService.js # Create sample & print job records
```

---

## ⚙️ Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environments**:

   * Copy `.env.development` and `.env.production` into your project root.
   * Fill in your Shopify secret and Airtable credentials.

3. **Scripts** (in `package.json`):

   * `npm run dev` → starts `webhook-server.js` in development mode (loads `.env.development`).
   * `npm start` → starts server in production mode (loads `.env.production`).
   * `npm run test-cli` → runs `send-to-airtable.js` against `testdata.json` (development env).

---

## 🚀 Running Locally (CLI)

```bash
npm run test-cli
```

* Reads `testdata.json`.
* Processes the order through all services.
* Logs created Airtable record IDs or errors.

---

## 🔨 Running Locally (Webhook)

1. Start the server:

   ```bash
   npm run dev
   ```
2. Expose via ngrok (or similar):

   ```bash
   ngrok http 3000
   ```
3. In Shopify Admin, set your webhook to:

   ```
   https://<ngrok-id>.ngrok.io/webhook
   ```
4. Trigger a real "Order paid" event in your dev store—watch console logs and Airtable updates.

---

## 🛠️ Development Guidelines

* **Helpers** in `/helpers` hold pure utility logic (date formatting, generic API calls).
* **Services** in `/services` orchestrate domain-specific workflows (orders, clients, items).
* **Config** in `/config/tables.js` centralizes all table and field names to avoid typos.
* **.env** files per environment; never commit real keys.

---

## 📈 Next Steps

* Add rate-limit/retry logic for Airtable.
* Integrate unit tests for helpers and services.
* Set up CI to validate code and linting.
* Deploy `webhook-server.js` to a production host with proper logging.

Happy coding! 🚀
