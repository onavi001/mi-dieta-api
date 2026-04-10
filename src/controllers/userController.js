const { createUserClient, supabaseAdmin } = require('../config/supabase')

function success(res, data, status = 200) {
  return res.status(status).json({ ok: true, data })
}

function failure(res, error, status = 400) {
  return res.status(status).json({ ok: false, error })
}

async function ensureAdmin(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data || data.role !== 'admin') {
    return false
  }

  return true
}

async function getMyProfile(req, res) {
  try {
    const supabase = createUserClient(req.accessToken)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single()

    if (error) {
      const fallbackName = req.user.user_metadata?.name || req.user.email?.split('@')[0] || 'Usuario'

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('profiles')
        .upsert({ id: req.user.id, name: fallbackName }, { onConflict: 'id' })
        .select('*')
        .single()

      if (insertError) {
        return failure(res, insertError.message, 404)
      }

      return success(res, { profile: inserted })
    }

    return success(res, { profile: data })
  } catch (error) {
    return failure(res, 'Failed to fetch my profile', 500)
  }
}

async function listUsers(req, res) {
  try {
    if (!(await ensureAdmin(req.user.id))) {
      return failure(res, 'Admin access required', 403)
    }

    const { data: authUsersData, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers()
    if (authUsersError) {
      return failure(res, authUsersError.message, 400)
    }

    const authUsers = authUsersData?.users || []
    const ids = authUsers.map((item) => item.id)

    let profiles = []
    if (ids.length > 0) {
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('id', ids)

      if (profilesError) {
        return failure(res, profilesError.message, 400)
      }

      profiles = profilesData || []
    }

    const profileById = new Map(profiles.map((item) => [item.id, item]))

    const users = authUsers.map((item) => ({
      id: item.id,
      email: item.email,
      created_at: item.created_at,
      last_sign_in_at: item.last_sign_in_at,
      profile: profileById.get(item.id) || null,
    }))

    return success(res, { users })
  } catch (error) {
    return failure(res, 'Failed to list users', 500)
  }
}

async function getUserById(req, res) {
  try {
    if (!(await ensureAdmin(req.user.id))) {
      return failure(res, 'Admin access required', 403)
    }

    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return failure(res, error.message, 404)
    }

    return success(res, { profile: data })
  } catch (error) {
    return failure(res, 'Failed to fetch user profile', 500)
  }
}

async function updateUser(req, res) {
  try {
    if (!(await ensureAdmin(req.user.id))) {
      return failure(res, 'Admin access required', 403)
    }

    const { id } = req.params
    const { name, role, nutritionalProfile } = req.body || {}

    const updatePayload = {}

    if (typeof name === 'string') {
      updatePayload.name = name
    }

    if (nutritionalProfile !== undefined) {
      updatePayload.nutritional_profile = nutritionalProfile
    }

    if (typeof role === 'string') {
      updatePayload.role = role
    }

    if (Object.keys(updatePayload).length === 0) {
      return failure(res, 'No fields provided to update')
    }

    const dbClient = supabaseAdmin

    const { data, error } = await dbClient
      .from('profiles')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      return failure(res, error.message, 400)
    }

    return success(res, { profile: data })
  } catch (error) {
    return failure(res, 'Failed to update user', 500)
  }
}

async function deleteUser(req, res) {
  try {
    if (!(await ensureAdmin(req.user.id))) {
      return failure(res, 'Admin access required', 403)
    }

    const { id } = req.params

    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id)

    if (profileDeleteError) {
      return failure(res, profileDeleteError.message, 400)
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (error) {
      return failure(res, error.message, 400)
    }

    return success(res, { deleted: true })
  } catch (error) {
    return failure(res, 'Failed to delete user', 500)
  }
}

module.exports = {
  getMyProfile,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
}
