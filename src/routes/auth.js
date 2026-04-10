const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const {
  register,
  login,
  logout,
  me,
} = require('../controllers/authController')

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', authMiddleware, logout)
router.get('/me', authMiddleware, me)

module.exports = router
