/**
 * ============================================
 *  Middleware de gestion d'erreurs
 * ============================================
 */

const logger = require('../utils/logger');

/**
 * Middleware de log des requêtes
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req.method, req.originalUrl, res.statusCode, duration);
  });

  next();
}

/**
 * Middleware 404
 */
function notFound(req, res, _next) {
  res.status(404).json({
    success: false,
    error:   `Route non trouvée: ${req.method} ${req.originalUrl}`
  });
}

/**
 * Middleware d'erreur global (4 paramètres)
 */
function errorHandler(err, req, res, _next) {
  logger.error('Erreur non gérée:', err.message);
  if (err.stack) logger.debug(err.stack);

  const status = err.statusCode || err.status || 500;

  res.status(status).json({
    success: false,
    error:   err.message || 'Erreur interne du serveur'
  });
}

module.exports = {
  requestLogger,
  notFound,
  errorHandler
};