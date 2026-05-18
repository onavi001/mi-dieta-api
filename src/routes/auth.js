const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const { authCredentialsLimiter, authRefreshLimiter } = require('../middleware/rateLimitAuth')
const {
  register,
  login,
  refresh,
  logout,
  requestPasswordReset,
  completePasswordRecovery,
  me,
} = require('../controllers/authController')

const router = express.Router()

router.post('/register', authCredentialsLimiter, register)
router.post('/login', authCredentialsLimiter, login)
router.post('/forgot-password', authCredentialsLimiter, requestPasswordReset)
router.post('/recovery/complete', authCredentialsLimiter, completePasswordRecovery)
router.post('/refresh', authRefreshLimiter, refresh)
router.post('/logout', authMiddleware, logout)
router.get('/me', authMiddleware, me)

module.exports = router
