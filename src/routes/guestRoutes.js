const { Router } = require('express');
const guestController = require('../controllers/guestController');

const router = Router();

// Lookup personalized guest info by token
router.get('/:token', guestController.getByToken);

module.exports = router;
