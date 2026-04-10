require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const planRoutes = require('./routes/plans')
const shareRoutes = require('./routes/shares')
const nutritionRoutes = require('./routes/nutrition')
const mealRoutes = require('./routes/meals')

const app = express()
const port = Number(process.env.PORT) || 3000
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

app.use(helmet())
app.use(cors({ origin: clientUrl, credentials: true }))
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ ok: true, data: { status: 'healthy' } })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/meals', mealRoutes)
app.use('/api/plans', planRoutes)
app.use('/api/shares', shareRoutes)
app.use('/api/nutrition', nutritionRoutes)

app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' })
})

app.use((error, req, res, next) => {
  console.error(error)
  res.status(500).json({ ok: false, error: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`mi-dieta-api listening on port ${port}`)
})

module.exports = app
