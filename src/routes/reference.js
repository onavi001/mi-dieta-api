const express = require('express')
const { getIngredientReference } = require('../controllers/referenceController')

const router = express.Router()

router.get('/ingredients', getIngredientReference)

module.exports = router
