const rsvpRepository = require('../repositories/rsvpRepository');
const guestRepository = require('../repositories/guestRepository');
const messageRepository = require('../repositories/messageRepository');
const { clean } = require('../utils/sanitizer');

class RsvpService {
  constructor(
    rsvpRepo = rsvpRepository,
    guestRepo = guestRepository,
    msgRepo = messageRepository
  ) {
    this.rsvpRepo = rsvpRepo;
    this.guestRepo = guestRepo;
    this.msgRepo = msgRepo;
  }

  submitRsvp({ status, token, name: rawName }) {
    if (!['accepted', 'declined'].includes(status)) {
      const err = new Error('Statut invalide');
      err.status = 400;
      throw err;
    }

    // 1. Personal link submission
    if (token) {
      const cleanToken = clean(token, 40);
      const guest = this.guestRepo.findByToken(cleanToken);
      if (!guest) {
        const err = new Error('Lien invalide');
        err.status = 404;
        throw err;
      }

      this.rsvpRepo.upsert({
        name: guest.name,
        key: `guest:${guest.id}`,
        status,
        guestId: guest.id,
      });

      return { ok: true, name: guest.name };
    }

    // 2. Open link submission: guest types their name
    const name = clean(rawName, 80);
    if (!name) {
      const err = new Error('Nom requis');
      err.status = 400;
      throw err;
    }

    this.rsvpRepo.upsert({
      name,
      key: name.toLowerCase(),
      status,
      guestId: null,
    });

    return { ok: true, name };
  }

  listRsvps() {
    return this.rsvpRepo.findAll();
  }

  removeRsvp(id) {
    this.rsvpRepo.deleteById(id);
  }

  getSummary() {
    const counts = this.rsvpRepo.getCounts();
    const messagesCount = this.msgRepo.count();
    const pendingCount = this.guestRepo.countPending();

    return {
      ...counts,
      messages: messagesCount,
      pending: pendingCount,
    };
  }
}

module.exports = new RsvpService();
