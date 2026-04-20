const crypto = require('crypto')

function genReqId() {
  return crypto.randomUUID()
}

/** Para pino-http: sin cabeceras ni cuerpo. */
function httpReqSerializer(req) {
  if (!req) return req
  return {
    id: req.id,
    method: req.method,
    url: req.url,
  }
}

function httpResSerializer(res) {
  if (!res || res.statusCode === undefined) return res
  return { statusCode: res.statusCode }
}

/** Solo identificador de usuario; nunca correo ni tokens. */
function userIdFromReq(req) {
  const id = req?.user?.id
  return typeof id === 'string' && id ? { userId: id } : {}
}

/** Dominio del correo (p. ej. para diagnóstico de rate limits), nunca la dirección completa. */
function emailDomain(email) {
  if (typeof email !== 'string' || !email.includes('@')) return {}
  const domain = email.split('@')[1]?.toLowerCase()
  return domain ? { emailDomain: domain } : {}
}

/**
 * Resumen seguro de un body para logs (claves permitidas).
 * No pasar objetos completos de comidas u overrides.
 */
function pickBodyFields(body, keys) {
  if (!body || typeof body !== 'object') return {}
  const out = {}
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(body, k) && body[k] !== undefined) {
      const v = body[k]
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        out[k] = v
      } else if (v === null) {
        out[k] = null
      }
    }
  }
  return out
}

module.exports = {
  genReqId,
  httpReqSerializer,
  httpResSerializer,
  userIdFromReq,
  emailDomain,
  pickBodyFields,
}
