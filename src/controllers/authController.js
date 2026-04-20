const { createClient } = require('@supabase/supabase-js')
const { supabase } = require('../config/supabase')
const { userIdFromReq, emailDomain } = require('../utils/safeLog')

function success(res, data, status = 200) {
  return res.status(status).json({ ok: true, data })
}

function failure(res, error, status = 400) {
  return res.status(status).json({ ok: false, error })
}

function isEmailRateLimitError(message) {
  return typeof message === 'string' && /email rate limit exceeded/i.test(message)
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body || {}
    const safeName = typeof name === 'string' ? name.trim() : ''

    if (!safeName || !email || !password) {
      req.log?.info({ event: 'auth.register_validation_fail' }, 'auth')
      return failure(res, 'name, email and password are required')
    }

    req.log?.info({ event: 'auth.register_attempt', ...emailDomain(email) }, 'auth')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: safeName },
      },
    })

    if (error) {
      req.log?.warn(
        { event: 'auth.register_supabase_error', ...emailDomain(email), code: error.code },
        'auth'
      )
      if (isEmailRateLimitError(error.message)) {
        return failure(
          res,
          'email rate limit exceeded: espera unos minutos o aumenta el limite en Supabase Auth > Rate Limits',
          429
        )
      }

      return failure(res, error.message)
    }

    req.log?.info(
      { event: 'auth.register_ok', userId: data.user?.id, ...emailDomain(email) },
      'auth'
    )
    return success(res, { user: data.user, session: data.session }, 201)
  } catch (error) {
    req.log?.error({ err: error, event: 'auth.register_exception' }, 'auth')
    return failure(res, 'Failed to register user', 500)
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {}

    if (!email || !password) {
      req.log?.info({ event: 'auth.login_validation_fail' }, 'auth')
      return failure(res, 'email and password are required')
    }

    req.log?.info({ event: 'auth.login_attempt', ...emailDomain(email) }, 'auth')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      req.log?.warn({ event: 'auth.login_fail', ...emailDomain(email), code: error.code }, 'auth')
      return failure(res, error.message, 401)
    }

    req.log?.info({ event: 'auth.login_ok', userId: data.user?.id, ...emailDomain(email) }, 'auth')
    return success(res, { user: data.user, session: data.session })
  } catch (error) {
    req.log?.error({ err: error, event: 'auth.login_exception' }, 'auth')
    return failure(res, 'Failed to login', 500)
  }
}

async function refresh(req, res) {
  try {
    const { refresh_token: refreshToken } = req.body || {}

    if (!refreshToken || typeof refreshToken !== 'string') {
      req.log?.info({ event: 'auth.refresh_validation_fail' }, 'auth')
      return failure(res, 'refresh_token is required', 400)
    }

    req.log?.info({ event: 'auth.refresh_attempt' }, 'auth')

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error) {
      req.log?.warn({ event: 'auth.refresh_fail', code: error.code }, 'auth')
      return failure(res, error.message, 401)
    }

    if (!data.session?.access_token) {
      req.log?.warn({ event: 'auth.refresh_no_session' }, 'auth')
      return failure(res, 'No session after refresh', 401)
    }

    req.log?.info({ event: 'auth.refresh_ok', userId: data.user?.id }, 'auth')
    return success(res, { user: data.user, session: data.session })
  } catch (error) {
    req.log?.error({ err: error, event: 'auth.refresh_exception' }, 'auth')
    return failure(res, 'Failed to refresh session', 500)
  }
}

async function logout(req, res) {
  try {
    const token = req.accessToken

    if (!token) {
      req.log?.info({ ...userIdFromReq(req), event: 'auth.logout_no_token' }, 'auth')
      return failure(res, 'Missing session token', 401)
    }

    const scopedClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    const { error } = await scopedClient.auth.signOut()

    if (error) {
      req.log?.warn({ ...userIdFromReq(req), event: 'auth.logout_supabase_error', code: error.code }, 'auth')
      return failure(res, error.message, 400)
    }

    req.log?.info({ ...userIdFromReq(req), event: 'auth.logout_ok' }, 'auth')
    return success(res, { loggedOut: true })
  } catch (error) {
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'auth.logout_exception' }, 'auth')
    return failure(res, 'Failed to logout', 500)
  }
}

async function me(req, res) {
  try {
    const user = req.user

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      req.log?.warn({ ...userIdFromReq(req), event: 'auth.me_profile_error', code: error.code }, 'auth')
      return failure(res, error.message, 404)
    }

    req.log?.debug({ ...userIdFromReq(req), event: 'auth.me_ok' }, 'auth')
    return success(res, { user, profile })
  } catch (error) {
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'auth.me_exception' }, 'auth')
    return failure(res, 'Failed to fetch current user', 500)
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
}
