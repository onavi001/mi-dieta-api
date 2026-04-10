const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const {
  getMyPlan,
  generateMyPlan,
  getMySlotAlternatives,
  updateMySlot,
  replaceMySlotIngredient,
  completeMySlot,
  updateMyGrocery,
  updateMyWeekState,
  getUserPlan,
  getCombinedPlan,
} = require('../controllers/planController')

const router = express.Router()

router.get('/my', authMiddleware, getMyPlan)
router.post('/my/generate', authMiddleware, generateMyPlan)
router.post('/my/alternatives', authMiddleware, getMySlotAlternatives)
router.put('/my/slot', authMiddleware, updateMySlot)
router.put('/my/ingredient', authMiddleware, replaceMySlotIngredient)
router.put('/my/complete', authMiddleware, completeMySlot)
router.put('/my/grocery', authMiddleware, updateMyGrocery)
router.put('/my/week-state', authMiddleware, updateMyWeekState)
router.get('/combined/:otherUserId', authMiddleware, getCombinedPlan)
router.get('/:userId', authMiddleware, getUserPlan)

module.exports = router
