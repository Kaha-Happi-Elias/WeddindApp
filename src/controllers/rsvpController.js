const rsvpService = require('../services/rsvpService');

class RsvpController {
  constructor(service = rsvpService) {
    this.service = service;
  }

  submit = (req, res, next) => {
    try {
      const { status, token, name } = req.body;
      const result = this.service.submitRsvp({ status, token, name });
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  list = (req, res, next) => {
    try {
      const rsvps = this.service.listRsvps();
      res.json(rsvps);
    } catch (err) {
      next(err);
    }
  };

  delete = (req, res, next) => {
    try {
      this.service.removeRsvp(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  };

  summary = (req, res, next) => {
    try {
      const summary = this.service.getSummary();
      res.json(summary);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new RsvpController();
