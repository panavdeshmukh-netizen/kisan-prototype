import winston from 'winston'

const { combine, timestamp, errors, printf, colorize, align } = winston.format

const humanFormat = printf(({ timestamp, level, message, stack }) =>
  stack
    ? `${timestamp} ${level}: ${message} - ${stack}`
    : `${timestamp} ${level}: ${message}`,
)

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format:
    process.env.NODE_ENV === 'production'
      ? combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          errors({ stack: true }),
          humanFormat,
        )
      : combine(
          colorize(),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          align(),
          errors({ stack: true }),
          humanFormat,
        ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
  exceptionHandlers: [new winston.transports.Console()],
  rejectionHandlers: [new winston.transports.Console()],
  exitOnError: false,
})

logger.stream = {
  write: (message) => {
    logger.info(message.replace(/\n$/, ''))
  },
}

export default logger
