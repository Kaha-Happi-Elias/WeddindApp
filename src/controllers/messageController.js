const messageService = require('../services/messageService');

class MessageController {
  constructor(service = messageService) {
    this.service = service;
  }

  listPublic = (req, res, next) => {
    try {
      const messages = this.service.listMessages(200);
      res.json(messages);
    } catch (err) {
      next(err);
    }
  };

  listAdmin = (req, res, next) => {
    try {
      const messages = this.service.listMessages(10000);
      res.json(messages);
    } catch (err) {
      next(err);
    }
  };

  create = (req, res, next) => {
    try {
      const { author, text, token } = req.body;
      const result = this.service.postMessage({ author, text, token });
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  delete = (req, res, next) => {
    try {
      this.service.removeMessage(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new MessageController();
