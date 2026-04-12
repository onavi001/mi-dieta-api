const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const {
  getMyProfile,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  resetMyData,
} = require('../controllers/userController')

const router = express.Router()

router.get('/me/profile', authMiddleware, getMyProfile)
router.post('/me/reset-data', authMiddleware, resetMyData)
router.get('/', authMiddleware, listUsers)
router.get('/:id', authMiddleware, getUserById)
router.put('/:id', authMiddleware, updateUser)
router.delete('/:id', authMiddleware, deleteUser)

module.exports = router
