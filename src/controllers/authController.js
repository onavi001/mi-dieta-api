const { createClient } = require('@supabase/supabase-js')
const { supabase } = require('../config/supabase')

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
      return failure(res, 'name, email and password are required')
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: safeName },
      },
    })

    if (error) {
      if (isEmailRateLimitError(error.message)) {
        return failure(
          res,
          'email rate limit exceeded: espera unos minutos o aumenta el limite en Supabase Auth > Rate Limits',
          429
        )
      }

      return failure(res, error.message)
    }

    return success(res, { user: data.user, session: data.session }, 201)
  } catch (error) {
    return failure(res, 'Failed to register user', 500)
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {}

    if (!email || !password) {
      return failure(res, 'email and password are required')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return failure(res, error.message, 401)
    }

    return success(res, { user: data.user, session: data.session })
  } catch (error) {
    return failure(res, 'Failed to login', 500)
  }
}

async function logout(req, res) {
  try {
    const token = req.accessToken

    if (!token) {
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
      return failure(res, error.message, 400)
    }

    return success(res, { loggedOut: true })
  } catch (error) {
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
      return failure(res, error.message, 404)
    }

    return success(res, { user, profile })
  } catch (error) {
    return failure(res, 'Failed to fetch current user', 500)
  }
}

module.exports = {
  register,
  login,
  logout,
  me,
}
