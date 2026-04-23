const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const {
  getMyProfile,
  getMyDailyEngagement,
  updateMyDailyEngagement,
  trackMyEvent,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  resetMyData,
} = require('../controllers/userController')

const router = express.Router()

router.get('/me/profile', authMiddleware, getMyProfile)
router.get('/me/daily-engagement', authMiddleware, getMyDailyEngagement)
router.put('/me/daily-engagement', authMiddleware, updateMyDailyEngagement)
router.post('/me/events', authMiddleware, trackMyEvent)
router.post('/me/reset-data', authMiddleware, resetMyData)
router.get('/', authMiddleware, listUsers)
router.get('/:id', authMiddleware, getUserById)
router.put('/:id', authMiddleware, updateUser)
router.delete('/:id', authMiddleware, deleteUser)

module.exports = router
