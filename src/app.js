require('dotenv').config()
require('./instrumentSentry').instrumentSentry()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const pinoHttp = require('pino-http')
const Sentry = require('@sentry/node')

const logger = require('./utils/logger')
const { genReqId, httpReqSerializer, httpResSerializer } = require('./utils/safeLog')
const { corsOriginCallback, parseAllowedOrigins } = require('./utils/corsOrigins')

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const planRoutes = require('./routes/plans')
const shareRoutes = require('./routes/shares')
const nutritionRoutes = require('./routes/nutrition')
const mealRoutes = require('./routes/meals')
const referenceRoutes = require('./routes/reference')

const app = express()
const port = Number(process.env.PORT) || 3000
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

app.use(helmet())
app.use(cors({ origin: clientUrl, credentials: true }))
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id || genReqId(),
    serializers: {
      req: httpReqSerializer,
      res: httpResSerializer,
    },
    customLogLevel: (res, err) => {
      if (err) return 'error'
      if (res.statusCode >= 500) return 'error'
      if (res.statusCode >= 400) return 'warn'
      return 'info'
    },
    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
  })
)
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ ok: true, data: { status: 'healthy' } })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/meals', mealRoutes)
app.use('/api/reference', referenceRoutes)
app.use('/api/plans', planRoutes)
app.use('/api/shares', shareRoutes)
app.use('/api/nutrition', nutritionRoutes)

app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' })
})

if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app)
}

app.use((error, req, res, _next) => {
  const log = req.log || logger
  log.error({ err: error }, 'unhandled error')
  if (res.headersSent) {
    return
  }
  res.status(500).json({ ok: false, error: 'Internal server error' })
})

const allowedOrigins = parseAllowedOrigins()
const server = app.listen(port, () => {
  logger.info({ port, corsOrigins: allowedOrigins, trustProxy: Boolean(app.get('trust proxy')) }, 'mi-dieta-api listening')
})

function shutdown(signal) {
  logger.info({ signal }, 'shutdown')
  server.close(() => {
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

module.exports = app
