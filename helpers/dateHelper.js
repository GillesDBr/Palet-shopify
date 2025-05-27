// helpers/dateHelper.js
/**
 * formatDate()
 * Convert ISO timestamp to MM-mmm-YYYY (e.g. 05-may-2025)
 */
function formatDate(dateString) {
  const d = new Date(dateString);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const mmm = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'][d.getMonth()];
  const yyyy = d.getFullYear();
  return `${mm}-${mmm}-${yyyy}`;
}

module.exports = { formatDate };