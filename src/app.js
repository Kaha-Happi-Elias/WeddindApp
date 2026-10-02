const path = require('path');
const express = require('express');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

function createApp() {
  const app = express();

  // Reverse proxy support (for cloud deployments: Render, Railway, Fly.io, Nginx)
  app.set('trust proxy', 1);

  // Body parser with payload limit
  app.use(express.json({ limit: '50kb' }));

  // Static files for the guest-facing landing page
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));

  // Application routes (API + Admin)
  app.use(routes);

  // Centralized error handling
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
