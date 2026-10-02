const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('../config/env');
const { initSchema } = require('./schema');

let db = null;

function getDatabase(customPath) {
  const dbPath = customPath || process.env.DB_PATH || config.DB_PATH;

  if (!db) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
}

function closeDatabase() {
  if (db && db.open) {
    db.close();
    db = null;
  }
}

module.exports = {
  getDatabase,
  closeDatabase,
};
