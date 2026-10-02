const { getDatabase, closeDatabase } = require('./connection');
const { initSchema } = require('./schema');

function initDb(dbPath) {
  const db = getDatabase(dbPath);
  initSchema(db);
  return db;
}

module.exports = {
  getDatabase,
  closeDatabase,
  initDb,
};
