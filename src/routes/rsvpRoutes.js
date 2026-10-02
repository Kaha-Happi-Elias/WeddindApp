const { Router } = require('express');
const rsvpController = require('../controllers/rsvpController');
const { publicWriteLimiter } = require('../middlewares/rateLimiter');

const router = Router();

// Submit or update RSVP response
router.post('/', publicWriteLimiter, rsvpController.submit);

module.exports = router;
