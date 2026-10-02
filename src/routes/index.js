const { Router } = require('express');
const guestRoutes = require('./guestRoutes');
const rsvpRoutes = require('./rsvpRoutes');
const messageRoutes = require('./messageRoutes');
const adminRoutes = require('./adminRoutes');

const router = Router();

// Mount public API routes
router.use('/api/guest', guestRoutes);
router.use('/api/rsvp', rsvpRoutes);
router.use('/api/messages', messageRoutes);

// Mount admin web page and API routes
router.use('/', adminRoutes);

module.exports = router;
