const config = require('./config/env');
const { initDb, closeDatabase } = require('./db');
const createApp = require('./app');

// Initialize database schema and migrations
initDb(config.DB_PATH);

// Create Express application
const app = createApp();

const server = app.listen(config.PORT, () => {
  console.log(`✅ Invitation:   http://localhost:${config.PORT}`);
  console.log(`🔐 Espace mariés: http://localhost:${config.PORT}/admin`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${config.PORT} is already in use by another process.`);
    console.error(`   To free port ${config.PORT} in PowerShell, run:`);
    console.error(`     Get-Process -Id (Get-NetTCPConnection -LocalPort ${config.PORT}).OwningProcess | Stop-Process -Force`);
    console.error(`   Or set a different port in your .env file: PORT=3001\n`);
    process.exit(1);
  } else {
    throw err;
  }
});

// Graceful shutdown handling
function handleShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    closeDatabase();
    console.log('Database connection closed.');
    process.exit(0);
  });

  // Force close if graceful shutdown hangs
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = server;
