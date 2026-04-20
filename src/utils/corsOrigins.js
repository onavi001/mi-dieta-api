/**
 * Orígenes permitidos para CORS (credenciales).
 * CLIENT_URL: un origen (p. ej. https://mi-dieta.netlify.app)
 * CLIENT_URLS: lista separada por comas o espacios (preview Netlify, staging, etc.)
 */
function parseAllowedOrigins() {
  const merged = [process.env.CLIENT_URL, process.env.CLIENT_URLS].filter(Boolean).join(',')
  const list = merged
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  return list.length > 0 ? list : ['http://localhost:5173']
}

/**
 * @param {string | undefined} origin - Cabecera Origin del navegador
 * @param {(err: Error | null, allow?: boolean) => void} callback
 */
function corsOriginCallback(origin, callback) {
  const allowed = parseAllowedOrigins()

  // Peticiones sin Origin (curl, health checks, mismo host)
  if (!origin) {
    return callback(null, true)
  }

  if (allowed.includes(origin)) {
    return callback(null, true)
  }

  callback(null, false)
}

module.exports = {
  parseAllowedOrigins,
  corsOriginCallback,
}
