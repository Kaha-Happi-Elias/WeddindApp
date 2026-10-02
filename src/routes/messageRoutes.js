const { Router } = require('express');
const messageController = require('../controllers/messageController');
const { publicWriteLimiter } = require('../middlewares/rateLimiter');

const router = Router();

// Public guestbook endpoints
router.get('/', messageController.listPublic);
router.post('/', publicWriteLimiter, messageController.create);

module.exports = router;
