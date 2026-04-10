const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const {
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
} = require('../controllers/shareController')

const router = express.Router()

router.get('/my', authMiddleware, listMyShares)
router.get('/my/users', authMiddleware, listMyShareUsers)
router.get('/search', authMiddleware, searchShareCandidates)
router.post('/', authMiddleware, createShare)
router.put('/:sharedWithUserId', authMiddleware, updateShare)
router.delete('/:sharedWithUserId', authMiddleware, deleteShare)
router.get('/invites/incoming', authMiddleware, listIncomingInvites)
router.get('/invites/outgoing', authMiddleware, listOutgoingInvites)
router.post('/invites', authMiddleware, sendShareInvite)
router.post('/invites/:inviteId/accept', authMiddleware, acceptInvite)
router.post('/invites/:inviteId/reject', authMiddleware, rejectInvite)

module.exports = router
