const { supabase } = require('../config/supabase')

function sendUnauthorized(res, message = 'Unauthorized') {
  return res.status(401).json({ ok: false, error: message })
}

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''

    if (!authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'Missing Bearer token')
    }

    const token = authHeader.slice('Bearer '.length).trim()

    if (!token) {
      return sendUnauthorized(res, 'Missing Bearer token')
    }

    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data?.user) {
      return sendUnauthorized(res, 'Invalid or expired token')
    }

    req.user = data.user
    req.accessToken = token

    return next()
  } catch (error) {
    return sendUnauthorized(res)
  }
}

module.exports = {
  authMiddleware,
}
