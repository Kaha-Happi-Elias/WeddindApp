/**
 * Initializes the database schema and performs necessary migrations.
 * @param {import('better-sqlite3').Database} db
 */
function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS guests (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      token      TEXT NOT NULL UNIQUE,            -- secret part of the personal link
      name       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );

    CREATE TABLE IF NOT EXISTS rsvps (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      name_key   TEXT NOT NULL UNIQUE,            -- one answer per guest ("guest:<id>" for personal links)
      status     TEXT NOT NULL CHECK (status IN ('accepted','declined')),
      guest_id   INTEGER,                         -- set when the answer came from a personal link
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      author     TEXT NOT NULL,
      text       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );
  `);

  // Migration: Upgrade an older database that has no guest_id column
  const rsvpsColumns = db.prepare('PRAGMA table_info(rsvps)').all();
  if (!rsvpsColumns.some(c => c.name === 'guest_id')) {
    db.exec('ALTER TABLE rsvps ADD COLUMN guest_id INTEGER');
  }
}

module.exports = {
  initSchema,
};
