// Helper functions for logging order processing
const fs = require('fs');
const path = require('path');

function formatItemDetails(item) {
  let design = '', colors = '';
  item.properties.forEach(prop => {
    if (prop.name === 'Design') design = prop.value;
    if (prop.name === 'Colors') colors = prop.value;
  });
  const [color1, color2] = colors ? colors.replace(/\s+/g, '').split('+') : ['', ''];
  return { design, color1, color2 };
}

function formatOrderLog(order, recordId, status = 'success') {
  const projectName = `#${order.order_number} ${order.customer.first_name} ${order.customer.last_name}`;
  const timestamp = new Date().toISOString();
  
  let logLines = [];
  
  // Different status indicators
  const statusSymbols = {
    'success': '✅ Order processing completed',
    'duplicate': '⚠️ Duplicate order detected',
    'error': '❌ Order processing failed'
  };
  
  logLines.push(`[${timestamp}] ${statusSymbols[status]}:`);
  logLines.push(`Project: ${projectName}`);
  
  if (status === 'duplicate') {
    logLines.push(`Found existing record: ${recordId}`);
    logLines.push('Skipping creation to avoid duplicate\n');
  } else if (status === 'success') {
    logLines.push(`Record ID: ${recordId}\n`);
    
    // Log details for each line item
    order.line_items.forEach(item => {
      const { design, color1, color2 } = formatItemDetails(item);
      const quantity = item.fulfillable_quantity;
      
      if (item.sku === '100') {
        logLines.push(`📦 Added ${quantity} curated sample box(es)`);
      } 
      else if (item.sku === '200') {
        logLines.push(`🔍 Added ${quantity} sample(s):`);
        logLines.push(`   Design: ${design}`);
        logLines.push(`   Colors: ${color1}${color2 ? ' + ' + color2 : ''}`);
      }
      else if (item.sku === '300') {
        logLines.push(`📏 Added ${quantity} sqm print job:`);
        logLines.push(`   Design: ${design}`);
        logLines.push(`   Colors: ${color1}${color2 ? ' + ' + color2 : ''}`);
      }
    });
  }
  
  return logLines.join('\n') + '\n\n';
}

function writeToLog(message) {
  const logDir = path.join(process.cwd(), 'logs');
  const logFile = path.join(logDir, 'order-webhook.log');
  
  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  
  // Append to log file
  fs.appendFileSync(logFile, message);
  
  // Also log to console
  console.log(message);
}

module.exports = {
  formatOrderLog,
  writeToLog
}; 