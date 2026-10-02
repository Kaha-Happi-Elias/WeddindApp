const guestRepository = require('../repositories/guestRepository');
const { clean } = require('../utils/sanitizer');

class GuestService {
  constructor(repo = guestRepository) {
    this.repo = repo;
  }

  getGuestByToken(rawToken) {
    const token = clean(rawToken, 40);
    if (!token) return null;
    return this.repo.findByToken(token);
  }

  listGuests() {
    return this.repo.findAll();
  }

  createGuests(rawInput) {
    const rawList = Array.isArray(rawInput)
      ? rawInput
      : String(rawInput || '').split(/\r?\n/);

    const names = rawList
      .map((name) => clean(name, 80))
      .filter(Boolean)
      .slice(0, 500);

    if (names.length === 0) {
      const err = new Error('Aucun nom');
      err.status = 400;
      throw err;
    }

    return this.repo.addBatch(names);
  }

  removeGuest(id) {
    this.repo.delete(id);
  }

  countPending() {
    return this.repo.countPending();
  }
}

module.exports = new GuestService();
