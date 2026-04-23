const { createUserClient, supabaseAdmin } = require('../config/supabase')
const { userIdFromReq } = require('../utils/safeLog')
const SELF_SERVICE_RESET_USER_ID = '4a9daa23-4aee-4bcc-bdf3-4c50931607ea'

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
    req.log?.debug({ ...userIdFromReq(req), event: 'user.profile_me' }, 'user')
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
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'user.profile_me_error' }, 'user')
    return failure(res, 'Failed to fetch my profile', 500)
  }
}

async function listUsers(req, res) {
  try {
    if (!(await ensureAdmin(req.user.id))) {
      return failure(res, 'Admin access required', 403)
    }

    req.log?.info({ ...userIdFromReq(req), event: 'user.admin_list' }, 'user')

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
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'user.admin_list_error' }, 'user')
    return failure(res, 'Failed to list users', 500)
  }
}

async function getUserById(req, res) {
  try {
    if (!(await ensureAdmin(req.user.id))) {
      return failure(res, 'Admin access required', 403)
    }

    const { id } = req.params

    req.log?.info({ ...userIdFromReq(req), event: 'user.admin_get', targetUserId: id }, 'user')

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
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'user.admin_get_error' }, 'user')
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

    const fieldsTouched = []
    if (name !== undefined) fieldsTouched.push('name')
    if (role !== undefined) fieldsTouched.push('role')
    if (nutritionalProfile !== undefined) fieldsTouched.push('nutritionalProfile')
    req.log?.info({ ...userIdFromReq(req), event: 'user.admin_update', targetUserId: id, fields: fieldsTouched }, 'user')

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
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'user.admin_update_error' }, 'user')
    return failure(res, 'Failed to update user', 500)
  }
}

async function deleteUser(req, res) {
  try {
    if (!(await ensureAdmin(req.user.id))) {
      return failure(res, 'Admin access required', 403)
    }

    const { id } = req.params

    req.log?.warn({ ...userIdFromReq(req), event: 'user.admin_delete', targetUserId: id }, 'user')

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
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'user.admin_delete_error' }, 'user')
    return failure(res, 'Failed to delete user', 500)
  }
}

async function resetMyData(req, res) {
  try {
    if (req.user.id !== SELF_SERVICE_RESET_USER_ID) {
      return failure(res, 'Not allowed', 403)
    }

    const userId = req.user.id

    req.log?.warn({ ...userIdFromReq(req), event: 'user.reset_self_service' }, 'user')

    const [
      { error: sharesOwnerError },
      { error: sharesTargetError },
      { error: invitesOwnerError },
      { error: invitesTargetError },
      { error: progressError },
      { error: versionsError },
      { error: nutritionProfileError },
      { error: weeksError },
      { error: profileResetError },
    ] = await Promise.all([
      supabaseAdmin.from('plan_shares').delete().eq('owner_user_id', userId),
      supabaseAdmin.from('plan_shares').delete().eq('shared_with_user_id', userId),
      supabaseAdmin.from('plan_share_invites').delete().eq('owner_user_id', userId),
      supabaseAdmin.from('plan_share_invites').delete().eq('target_user_id', userId),
      supabaseAdmin.from('nutrition_progress_logs').delete().eq('user_id', userId),
      supabaseAdmin.from('nutrition_plan_versions').delete().eq('user_id', userId),
      supabaseAdmin.from('nutrition_profiles').delete().eq('user_id', userId),
      supabaseAdmin.from('meal_plan_weeks').delete().eq('user_id', userId),
      supabaseAdmin
        .from('profiles')
        .update({ nutritional_profile: {}, daily_engagement: {} })
        .eq('id', userId),
    ])

    const firstError = [
      sharesOwnerError,
      sharesTargetError,
      invitesOwnerError,
      invitesTargetError,
      progressError,
      versionsError,
      nutritionProfileError,
      weeksError,
      profileResetError,
    ].find(Boolean)

    if (firstError) {
      return failure(res, firstError.message, 400)
    }

    return success(res, { reset: true })
  } catch (error) {
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'user.reset_self_service_error' }, 'user')
    return failure(res, 'Failed to reset my data', 500)
  }
}

function normalizeDailyEngagement(value) {
  const record = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const mood = typeof record.mood === 'string' ? record.mood : null
  const date = typeof record.date === 'string' ? record.date : null
  const streak = typeof record.streak === 'number' && Number.isFinite(record.streak) && record.streak >= 0
    ? Math.floor(record.streak)
    : 0
  const lastGoodDate = typeof record.lastGoodDate === 'string' ? record.lastGoodDate : null
  const updatedAt = typeof record.updatedAt === 'string' ? record.updatedAt : null

  return {
    date,
    mood,
    streak,
    lastGoodDate,
    updatedAt,
  }
}

async function getMyDailyEngagement(req, res) {
  try {
    req.log?.debug({ ...userIdFromReq(req), event: 'user.daily_engagement_get' }, 'user')
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('daily_engagement')
      .eq('id', req.user.id)
      .maybeSingle()

    if (error) {
      return failure(res, error.message, 400)
    }

    return success(res, { dailyEngagement: normalizeDailyEngagement(data?.daily_engagement) })
  } catch (error) {
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'user.daily_engagement_get_error' }, 'user')
    return failure(res, 'Failed to fetch daily engagement', 500)
  }
}

async function updateMyDailyEngagement(req, res) {
  try {
    const payload = normalizeDailyEngagement(req.body?.dailyEngagement)
    req.log?.info(
      { ...userIdFromReq(req), event: 'user.daily_engagement_update', mood: payload.mood, date: payload.date, streak: payload.streak },
      'user'
    )

    const nextPayload = {
      ...payload,
      updatedAt: new Date().toISOString(),
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ daily_engagement: nextPayload })
      .eq('id', req.user.id)

    if (error) {
      return failure(res, error.message, 400)
    }

    return success(res, { dailyEngagement: nextPayload })
  } catch (error) {
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'user.daily_engagement_update_error' }, 'user')
    return failure(res, 'Failed to update daily engagement', 500)
  }
}

async function trackMyEvent(req, res) {
  try {
    const event = typeof req.body?.event === 'string' ? req.body.event.slice(0, 80) : ''
    const context = req.body?.context && typeof req.body.context === 'object' && !Array.isArray(req.body.context)
      ? req.body.context
      : {}
    if (!event) {
      return failure(res, 'event is required', 400)
    }

    const insertPayload = {
      user_id: req.user.id,
      event_name: event,
      context,
      platform: 'web',
    }

    const { error } = await supabaseAdmin
      .from('app_event_logs')
      .insert(insertPayload)

    if (error) {
      return failure(res, error.message, 400)
    }

    return success(res, { tracked: true }, 201)
  } catch (error) {
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'user.track_event_error' }, 'user')
    return failure(res, 'Failed to track event', 500)
  }
}

module.exports = {
  getMyProfile,
  getMyDailyEngagement,
  updateMyDailyEngagement,
  trackMyEvent,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  resetMyData,
}
