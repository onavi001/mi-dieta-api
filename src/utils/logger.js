const pino = require('pino')
const { httpReqSerializer, httpResSerializer } = require('./safeLog')

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

const logger = pino({
  level,
  serializers: {
    req: httpReqSerializer,
    res: httpResSerializer,
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: [
      'password',
      '*.password',
      'token',
      '*.token',
      'access_token',
      '*.access_token',
      'refresh_token',
      '*.refresh_token',
      'refreshToken',
      '*.refreshToken',
      'authorization',
      '*.authorization',
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.refresh_token',
      'req.body.refreshToken',
      'req.body.access_token',
      'req.body.accessToken',
      'req.body.session',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

module.exports = logger
