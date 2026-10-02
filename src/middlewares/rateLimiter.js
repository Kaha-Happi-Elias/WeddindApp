/**
 * Memory-safe in-memory rate limiter factory.
 * Automatically evicts expired timestamps and cleans up stale IP entries to prevent memory leaks.
 *
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60,000 ms / 1 min)
 * @param {number} options.max - Maximum allowed requests per window (default: 20)
 * @param {string} options.message - Error message on limit exceeded
 */
function createRateLimiter({
  windowMs = 60000,
  max = 20,
  message = 'Trop de requêtes, réessayez dans une minute.',
} = {}) {
  const hits = new Map();

  // Periodically purge stale IP records every 5 minutes
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of hits.entries()) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) {
        hits.delete(ip);
      } else {
        hits.set(ip, valid);
      }
    }
  }, 5 * 60 * 1000);

  // Prevent keeping Node process alive just for the cleanup timer (important in tests / shutdowns)
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  const middleware = (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);

    if (arr.length >= max) {
      return res.status(429).json({ error: message });
    }

    arr.push(now);
    hits.set(ip, arr);
    next();
  };

  middleware.reset = () => hits.clear();
  return middleware;
}

// Default limiter for public writes (RSVP, messages)
const publicWriteLimiter = createRateLimiter({
  windowMs: 60000,
  max: 20,
  message: 'Trop de requêtes, réessayez dans une minute.',
});

module.exports = {
  createRateLimiter,
  publicWriteLimiter,
};
