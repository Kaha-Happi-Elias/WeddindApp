const crypto = require('crypto');
const config = require('../config/env');

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function basicAuth(req, res, next) {
  const [scheme, encoded] = (req.headers.authorization || '').split(' ');
  if (scheme === 'Basic' && encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString();
    const colonIndex = decoded.indexOf(':');
    if (colonIndex !== -1) {
      const user = decoded.slice(0, colonIndex);
      const password = decoded.slice(colonIndex + 1);
      if (safeEqual(user, config.ADMIN_USER) && safeEqual(password, config.ADMIN_PASSWORD)) {
        return next();
      }
    }
  }

  res.set('WWW-Authenticate', 'Basic realm="Espace des mariés"')
    .status(401)
    .send('Accès réservé aux mariés.');
}

module.exports = basicAuth;
