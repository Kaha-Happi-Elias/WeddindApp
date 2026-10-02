const guestService = require('../services/guestService');

class GuestController {
  constructor(service = guestService) {
    this.service = service;
  }

  getByToken = (req, res, next) => {
    try {
      const guest = this.service.getGuestByToken(req.params.token);
      if (!guest) {
        return res.status(404).json({ error: 'Lien invalide' });
      }
      res.json({ name: guest.name, status: guest.status || null });
    } catch (err) {
      next(err);
    }
  };

  list = (req, res, next) => {
    try {
      const guests = this.service.listGuests();
      res.json(guests);
    } catch (err) {
      next(err);
    }
  };

  create = (req, res, next) => {
    try {
      const created = this.service.createGuests(req.body.names);
      res.json({ created });
    } catch (err) {
      next(err);
    }
  };

  delete = (req, res, next) => {
    try {
      this.service.removeGuest(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new GuestController();
