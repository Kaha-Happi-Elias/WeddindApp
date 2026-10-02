/**
 * Centralized error handler middleware.
 */
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Erreur interne du serveur.';

  if (status >= 500) {
    console.error('Unhandled server error:', err);
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * 404 Not Found handler for unmatched API routes.
 */
function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Ressource non trouvée' });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
