const { supabaseAdmin } = require('../config/supabase')

function success(res, data, status = 200) {
  return res.status(status).json({ ok: true, data })
}

function failure(res, error, status = 400) {
  return res.status(status).json({ ok: false, error })
}

function normalizeInvite(invite) {
  return {
    id: invite.id,
    ownerUserId: invite.owner_user_id,
    targetUserId: invite.target_user_id,
    canEdit: Boolean(invite.can_edit),
    status: invite.status,
    createdAt: invite.created_at,
    updatedAt: invite.updated_at,
  }
}

async function listMyShares(req, res) {
  try {
    const userId = req.user.id

    const [ownedResult, receivedResult] = await Promise.all([
      supabaseAdmin
        .from('plan_shares')
        .select('owner_user_id, shared_with_user_id, can_edit, created_at')
        .eq('owner_user_id', userId),
      supabaseAdmin
        .from('plan_shares')
        .select('owner_user_id, shared_with_user_id, can_edit, created_at')
        .eq('shared_with_user_id', userId),
    ])

    if (ownedResult.error) {
      return failure(res, ownedResult.error.message, 400)
    }

    if (receivedResult.error) {
      return failure(res, receivedResult.error.message, 400)
    }

    return success(res, {
      owned: ownedResult.data || [],
      received: receivedResult.data || [],
    })
  } catch (error) {
    return failure(res, 'Failed to list shares', 500)
  }
}

async function listMyShareUsers(req, res) {
  try {
    const userId = req.user.id

    const { data: rows, error } = await supabaseAdmin
      .from('plan_shares')
      .select('owner_user_id, shared_with_user_id, can_edit, created_at')
      .or(`owner_user_id.eq.${userId},shared_with_user_id.eq.${userId}`)

    if (error) {
      return failure(res, error.message, 400)
    }

    const shareRows = rows || []
    const counterpartIds = [...new Set(
      shareRows.map((row) => (row.owner_user_id === userId ? row.shared_with_user_id : row.owner_user_id))
    )]

    if (counterpartIds.length === 0) {
      return success(res, { users: [] })
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, role, nutritional_profile, created_at')
      .in('id', counterpartIds)

    if (profilesError) {
      return failure(res, profilesError.message, 400)
    }

    const profileMap = new Map((profiles || []).map((item) => [item.id, item]))

    const users = counterpartIds
      .map((id) => {
        const profile = profileMap.get(id)
        if (!profile) return null

        const relation = shareRows.find((row) =>
          (row.owner_user_id === userId && row.shared_with_user_id === id) ||
          (row.owner_user_id === id && row.shared_with_user_id === userId)
        )

        return {
          profile,
          relation: relation
            ? {
              ownerUserId: relation.owner_user_id,
              sharedWithUserId: relation.shared_with_user_id,
              canEdit: relation.can_edit,
            }
            : null,
        }
      })
      .filter(Boolean)

    return success(res, { users })
  } catch (error) {
    return failure(res, 'Failed to list share users', 500)
  }
}

async function searchShareCandidates(req, res) {
  try {
    const currentUserId = req.user.id
    const query = String(req.query.q || '').trim().toLowerCase()

    if (query.length < 2) {
      return success(res, { users: [] })
    }

    const { data: authUsersData, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers()
    if (authUsersError) {
      return failure(res, authUsersError.message, 400)
    }

    const allAuthUsers = authUsersData?.users || []
    const matchedAuthUsers = allAuthUsers.filter((item) => {
      const email = String(item.email || '').toLowerCase()
      return email.includes(query)
    })

    const authUserIds = matchedAuthUsers
      .map((item) => item.id)
      .filter((id) => id && id !== currentUserId)

    if (authUserIds.length === 0) {
      return success(res, { users: [] })
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, role')
      .in('id', authUserIds)

    if (profilesError) {
      return failure(res, profilesError.message, 400)
    }

    const profileById = new Map((profiles || []).map((item) => [item.id, item]))

    const users = matchedAuthUsers
      .map((item) => {
        if (item.id === currentUserId) return null

        const profile = profileById.get(item.id)
        if (!profile) return null

        const searchableName = String(profile.name || '').toLowerCase()
        const searchableEmail = String(item.email || '').toLowerCase()
        if (!searchableName.includes(query) && !searchableEmail.includes(query)) {
          return null
        }

        return {
          id: item.id,
          email: item.email || '',
          name: profile.name,
          role: profile.role,
        }
      })
      .filter(Boolean)
      .slice(0, 10)

    return success(res, { users })
  } catch (error) {
    return failure(res, 'Failed to search share candidates', 500)
  }
}

async function createShare(req, res) {
  try {
    const ownerUserId = req.user.id
    const { sharedWithUserId, canEdit } = req.body || {}

    if (!sharedWithUserId) {
      return failure(res, 'sharedWithUserId is required')
    }

    if (sharedWithUserId === ownerUserId) {
      return failure(res, 'Cannot share with yourself')
    }

    const payload = {
      owner_user_id: ownerUserId,
      shared_with_user_id: sharedWithUserId,
      can_edit: Boolean(canEdit),
    }

    const { data, error } = await supabaseAdmin
      .from('plan_shares')
      .upsert(payload, { onConflict: 'owner_user_id,shared_with_user_id' })
      .select('*')
      .single()

    if (error) {
      return failure(res, error.message, 400)
    }

    return success(res, { share: data }, 201)
  } catch (error) {
    return failure(res, 'Failed to create share', 500)
  }
}

async function updateShare(req, res) {
  try {
    const ownerUserId = req.user.id
    const { sharedWithUserId } = req.params
    const { canEdit } = req.body || {}

    if (typeof canEdit !== 'boolean') {
      return failure(res, 'canEdit(boolean) is required')
    }

    const { data, error } = await supabaseAdmin
      .from('plan_shares')
      .update({ can_edit: canEdit })
      .eq('owner_user_id', ownerUserId)
      .eq('shared_with_user_id', sharedWithUserId)
      .select('*')
      .maybeSingle()

    if (error) {
      return failure(res, error.message, 400)
    }

    if (!data) {
      return failure(res, 'Share relationship not found', 404)
    }

    return success(res, { share: data })
  } catch (error) {
    return failure(res, 'Failed to update share', 500)
  }
}

async function deleteShare(req, res) {
  try {
    const ownerUserId = req.user.id
    const { sharedWithUserId } = req.params

    const { data, error } = await supabaseAdmin
      .from('plan_shares')
      .delete()
      .eq('owner_user_id', ownerUserId)
      .eq('shared_with_user_id', sharedWithUserId)
      .select('owner_user_id, shared_with_user_id')

    if (error) {
      return failure(res, error.message, 400)
    }

    if (!data || data.length === 0) {
      return failure(res, 'Share relationship not found', 404)
    }

    return success(res, { deleted: true })
  } catch (error) {
    return failure(res, 'Failed to delete share', 500)
  }
}

async function sendShareInvite(req, res) {
  try {
    const ownerUserId = req.user.id
    const { targetUserId, canEdit } = req.body || {}

    if (!targetUserId) {
      return failure(res, 'targetUserId is required')
    }

    if (targetUserId === ownerUserId) {
      return failure(res, 'Cannot invite yourself')
    }

    const { data, error } = await supabaseAdmin
      .from('plan_share_invites')
      .upsert(
        {
          owner_user_id: ownerUserId,
          target_user_id: targetUserId,
          can_edit: Boolean(canEdit),
          status: 'pending',
        },
        { onConflict: 'owner_user_id,target_user_id' }
      )
      .select('*')
      .single()

    if (error) {
      return failure(res, error.message, 400)
    }

    return success(res, { invite: normalizeInvite(data) }, 201)
  } catch (error) {
    return failure(res, 'Failed to send invite', 500)
  }
}

async function listIncomingInvites(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('plan_share_invites')
      .select('*')
      .eq('target_user_id', req.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      return failure(res, error.message, 400)
    }

    return success(res, { invites: (data || []).map(normalizeInvite) })
  } catch (error) {
    return failure(res, 'Failed to list incoming invites', 500)
  }
}

async function listOutgoingInvites(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('plan_share_invites')
      .select('*')
      .eq('owner_user_id', req.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      return failure(res, error.message, 400)
    }

    return success(res, { invites: (data || []).map(normalizeInvite) })
  } catch (error) {
    return failure(res, 'Failed to list outgoing invites', 500)
  }
}

async function acceptInvite(req, res) {
  try {
    const { inviteId } = req.params

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('plan_share_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('target_user_id', req.user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (inviteError) {
      return failure(res, inviteError.message, 400)
    }

    if (!invite) {
      return failure(res, 'Invite not found', 404)
    }

    const { error: shareError } = await supabaseAdmin
      .from('plan_shares')
      .upsert(
        {
          owner_user_id: invite.owner_user_id,
          shared_with_user_id: invite.target_user_id,
          can_edit: Boolean(invite.can_edit),
        },
        { onConflict: 'owner_user_id,shared_with_user_id' }
      )

    if (shareError) {
      return failure(res, shareError.message, 400)
    }

    const { data: updatedInvite, error: updateError } = await supabaseAdmin
      .from('plan_share_invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id)
      .select('*')
      .single()

    if (updateError) {
      return failure(res, updateError.message, 400)
    }

    return success(res, { invite: normalizeInvite(updatedInvite), accepted: true })
  } catch (error) {
    return failure(res, 'Failed to accept invite', 500)
  }
}

async function rejectInvite(req, res) {
  try {
    const { inviteId } = req.params

    const { data, error } = await supabaseAdmin
      .from('plan_share_invites')
      .update({ status: 'rejected' })
      .eq('id', inviteId)
      .eq('target_user_id', req.user.id)
      .eq('status', 'pending')
      .select('*')
      .maybeSingle()

    if (error) {
      return failure(res, error.message, 400)
    }

    if (!data) {
      return failure(res, 'Invite not found', 404)
    }

    return success(res, { invite: normalizeInvite(data), rejected: true })
  } catch (error) {
    return failure(res, 'Failed to reject invite', 500)
  }
}

module.exports = {
  listMyShares,
  listMyShareUsers,
  searchShareCandidates,
  createShare,
  updateShare,
  deleteShare,
  sendShareInvite,
  listIncomingInvites,
  listOutgoingInvites,
  acceptInvite,
  rejectInvite,
}
