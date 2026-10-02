const { getDatabase } = require('../db/connection');

class RsvpRepository {
  constructor(db = getDatabase()) {
    this.db = db;
    const NOW = "strftime('%Y-%m-%dT%H:%M:%SZ','now')";

    this.queries = {
      upsert: this.db.prepare(`
        INSERT INTO rsvps (name, name_key, status, guest_id)
        VALUES (@name, @key, @status, @guestId)
        ON CONFLICT(name_key) DO UPDATE SET
          name = excluded.name,
          status = excluded.status,
          updated_at = ${NOW}
      `),
      listAll: this.db.prepare(`
        SELECT id, name, status, created_at, updated_at
        FROM rsvps
        ORDER BY updated_at DESC
      `),
      deleteById: this.db.prepare('DELETE FROM rsvps WHERE id = ?'),
      counts: this.db.prepare(`
        SELECT
          COALESCE(SUM(status = 'accepted'), 0) AS accepted,
          COALESCE(SUM(status = 'declined'), 0) AS declined,
          COUNT(*) AS total
        FROM rsvps
      `),
    };
  }

  upsert({ name, key, status, guestId = null }) {
    return this.queries.upsert.run({ name, key, status, guestId });
  }

  findAll() {
    return this.queries.listAll.all();
  }

  deleteById(id) {
    return this.queries.deleteById.run(id);
  }

  getCounts() {
    return this.queries.counts.get();
  }
}

module.exports = new RsvpRepository();
