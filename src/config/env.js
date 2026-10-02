const path = require('path');
require('dotenv').config();

const config = {
  PORT: parseInt(process.env.PORT, 10) || 3000,
  ADMIN_USER: process.env.ADMIN_USER || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'changeme',
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'wedding.db'),
  NODE_ENV: process.env.NODE_ENV || 'development',
};

if (config.ADMIN_PASSWORD === 'changeme') {
  console.warn('⚠️  ADMIN_PASSWORD is not set in .env — anyone could guess it. Change it!');
}

module.exports = Object.freeze(config);
