const path = require('path');
const express = require('express');
const { Router } = express;
const basicAuth = require('../middlewares/auth');
const { createRateLimiter } = require('../middlewares/rateLimiter');
const adminController = require('../controllers/adminController');
const rsvpController = require('../controllers/rsvpController');
const guestController = require('../controllers/guestController');
const messageController = require('../controllers/messageController');

const router = Router();

// Brute-force protection: max 60 requests per minute per IP on admin routes
const adminLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Trop de requêtes administratives. Veuillez patienter.',
});

// Protect admin routes with rate limiting and HTTP Basic Authentication
router.use('/admin', adminLimiter, basicAuth);
router.use('/api/admin', adminLimiter, basicAuth);

// Admin dashboard web page
router.get('/admin', adminController.serveDashboard);

// Static assets for the admin dashboard (css/admin.css, js/admin.js)
router.use('/admin', express.static(path.join(__dirname, '..', '..', 'admin')));

// Dashboard summary stats
router.get('/api/admin/summary', rsvpController.summary);

// RSVPs management
router.get('/api/admin/rsvps', rsvpController.list);
router.delete('/api/admin/rsvps/:id', rsvpController.delete);

// Guestbook messages management
router.get('/api/admin/messages', messageController.listAdmin);
router.delete('/api/admin/messages/:id', messageController.delete);

// Personalized guest links management
router.get('/api/admin/guests', guestController.list);
router.post('/api/admin/guests', guestController.create);
router.delete('/api/admin/guests/:id', guestController.delete);

// CSV Export
router.get('/api/admin/rsvps.csv', adminController.exportCsv);

module.exports = router;
