/**
 * Inicialización opcional de Sentry. Ejecutar antes de cargar Express.
 * Requiere SENTRY_DSN en el entorno (Render / local).
 */
const Sentry = require('@sentry/node')

function instrumentSentry() {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  })
}

module.exports = { instrumentSentry }
