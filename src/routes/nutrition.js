const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const {
  getNutritionSummary,
  upsertNutritionProfile,
  listPlanVersions,
  createPlanVersion,
  upsertProgressLog,
  listProgressLogs,
  calculatePlanPreview,
} = require('../controllers/nutritionController')

const router = express.Router()

router.get('/summary', authMiddleware, getNutritionSummary)
router.put('/profile', authMiddleware, upsertNutritionProfile)
router.get('/plans', authMiddleware, listPlanVersions)
router.post('/plans', authMiddleware, createPlanVersion)
router.get('/progress', authMiddleware, listProgressLogs)
router.put('/progress', authMiddleware, upsertProgressLog)
router.post('/calculate-plan', authMiddleware, calculatePlanPreview)

module.exports = router
