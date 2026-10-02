const messageRepository = require('../repositories/messageRepository');
const guestRepository = require('../repositories/guestRepository');
const { clean } = require('../utils/sanitizer');

class MessageService {
  constructor(msgRepo = messageRepository, guestRepo = guestRepository) {
    this.msgRepo = msgRepo;
    this.guestRepo = guestRepo;
  }

  postMessage({ author: rawAuthor, text: rawText, token }) {
    let author = clean(rawAuthor, 80) || 'Invité';

    // If submitted via a verified personal link, enforce genuine guest name
    if (token) {
      const cleanToken = clean(token, 40);
      const guest = this.guestRepo.findByToken(cleanToken);
      if (guest) {
        author = guest.name;
      }
    }

    const text = clean(rawText, 500);
    if (!text) {
      const err = new Error('Message vide');
      err.status = 400;
      throw err;
    }

    this.msgRepo.create(author, text);
    return { ok: true };
  }

  listMessages(limit = 200) {
    return this.msgRepo.findLatest(limit);
  }

  removeMessage(id) {
    this.msgRepo.deleteById(id);
  }
}

module.exports = new MessageService();
