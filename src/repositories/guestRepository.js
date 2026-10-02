const crypto = require('crypto');
const { getDatabase } = require('../db/connection');

class GuestRepository {
  constructor(db = getDatabase()) {
    this.db = db;

    this.queries = {
      getByToken: this.db.prepare(`
        SELECT g.id, g.name, r.status
        FROM guests g
        LEFT JOIN rsvps r ON r.guest_id = g.id
        WHERE g.token = ?
      `),
      listAll: this.db.prepare(`
        SELECT g.id, g.name, g.token, g.created_at, r.status
        FROM guests g
        LEFT JOIN rsvps r ON r.guest_id = g.id
        ORDER BY g.name COLLATE NOCASE
      `),
      insert: this.db.prepare('INSERT INTO guests (token, name) VALUES (?, ?)'),
      deleteGuestRsvp: this.db.prepare('DELETE FROM rsvps WHERE guest_id = ?'),
      deleteById: this.db.prepare('DELETE FROM guests WHERE id = ?'),
      countPending: this.db.prepare(`
        SELECT COUNT(*) AS n
        FROM guests g
        LEFT JOIN rsvps r ON r.guest_id = g.id
        WHERE r.id IS NULL
      `),
    };

    // Atomic transaction to delete a guest and their associated RSVP
    this.removeGuestTx = this.db.transaction((id) => {
      this.queries.deleteGuestRsvp.run(id);
      this.queries.deleteById.run(id);
    });

    // Atomic transaction to batch-insert guests with unique cryptographic tokens
    this.addGuestsTx = this.db.transaction((names) => {
      return names.map((name) => {
        const token = crypto.randomBytes(9).toString('base64url'); // 12 unguessable URL-safe chars
        this.queries.insert.run(token, name);
        return { name, token };
      });
    });
  }

  findByToken(token) {
    return this.queries.getByToken.get(token);
  }

  findAll() {
    return this.queries.listAll.all();
  }

  addBatch(names) {
    return this.addGuestsTx(names);
  }

  delete(id) {
    this.removeGuestTx(id);
  }

  countPending() {
    return this.queries.countPending.get().n;
  }
}

module.exports = new GuestRepository();
