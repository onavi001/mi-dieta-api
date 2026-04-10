const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const {
  listMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
} = require('../controllers/mealController')

const router = express.Router()

router.get('/', authMiddleware, listMeals)
router.get('/:id', authMiddleware, getMealById)
router.post('/', authMiddleware, createMeal)
router.put('/:id', authMiddleware, updateMeal)
router.delete('/:id', authMiddleware, deleteMeal)

module.exports = router
