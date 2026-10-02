/**
 * Clean and normalize a string input with a maximum length.
 * Replaces consecutive whitespaces with a single space and trims.
 * @param {any} input
 * @param {number} max
 * @returns {string}
 */
function clean(input, max = 255) {
  return String(input || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/**
 * Escapes a cell value for safe CSV output and prevents formula injection.
 * @param {any} value
 * @returns {string}
 */
function escapeCsvCell(value) {
  let str = String(value ?? '');
  // Block spreadsheet formula injection (CSV Injection / CWE-1236)
  if (/^[=+\-@]/.test(str)) {
    str = "'" + str;
  }
  return '"' + str.replace(/"/g, '""') + '"';
}

module.exports = {
  clean,
  escapeCsvCell,
};
