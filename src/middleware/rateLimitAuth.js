const rateLimit = require('express-rate-limit')

const isProd = process.env.NODE_ENV === 'production'

function skipRateLimit() {
  return process.env.RATE_LIMIT_DISABLED === '1'
}

/** Login y registro: evita fuerza bruta de credenciales */
const authCredentialsLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.AUTH_RATE_LOGIN_MAX ?? (isProd ? 30 : 400)),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  handler: (req, res) => {
    res.status(429).json({ ok: false, error: 'Demasiados intentos. Espera unos minutos.' })
  },
})

/** Refresh de token: se llama con frecuencia; límite más alto por ventana corta */
const authRefreshLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_REFRESH_WINDOW_MS || 60 * 1000),
  max: Number(process.env.AUTH_RATE_REFRESH_MAX ?? (isProd ? 90 : 600)),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  handler: (req, res) => {
    res.status(429).json({ ok: false, error: 'Demasiadas renovaciones de sesion. Intenta de nuevo.' })
  },
})

module.exports = {
  authCredentialsLimiter,
  authRefreshLimiter,
}
