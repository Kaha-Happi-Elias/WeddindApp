const { getDatabase } = require('../db/connection');

class MessageRepository {
  constructor(db = getDatabase()) {
    this.db = db;

    this.queries = {
      insert: this.db.prepare('INSERT INTO messages (author, text) VALUES (?, ?)'),
      listLatest: this.db.prepare(`
        SELECT id, author, text, created_at
        FROM messages
        ORDER BY id DESC
        LIMIT ?
      `),
      deleteById: this.db.prepare('DELETE FROM messages WHERE id = ?'),
      count: this.db.prepare('SELECT COUNT(*) AS n FROM messages'),
    };
  }

  create(author, text) {
    return this.queries.insert.run(author, text);
  }

  findLatest(limit = 200) {
    return this.queries.listLatest.all(limit);
  }

  deleteById(id) {
    return this.queries.deleteById.run(id);
  }

  count() {
    return this.queries.count.get().n;
  }
}

module.exports = new MessageRepository();
