const { supabase } = require('../config/supabase')

function sendUnauthorized(req, res, message = 'Unauthorized', logReason) {
  if (logReason && req.log) {
    req.log.debug({ event: 'auth_denied', reason: logReason }, 'auth middleware')
  }
  return res.status(401).json({ ok: false, error: message })
}

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''

    if (!authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(req, res, 'Missing Bearer token', 'missing_bearer')
    }

    const token = authHeader.slice('Bearer '.length).trim()

    if (!token) {
      return sendUnauthorized(req, res, 'Missing Bearer token', 'empty_token')
    }

    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data?.user) {
      if (req.log) {
        req.log.warn(
          { event: 'auth_invalid_token', code: error?.code || 'unknown' },
          'auth middleware'
        )
      }
      return sendUnauthorized(req, res, 'Invalid or expired token')
    }

    req.user = data.user
    req.accessToken = token

    return next()
  } catch (error) {
    if (req.log) {
      req.log.error({ err: error, event: 'auth_middleware_exception' }, 'auth middleware')
    }
    return sendUnauthorized(req, res, 'Unauthorized')
  }
}

module.exports = {
  authMiddleware,
}
