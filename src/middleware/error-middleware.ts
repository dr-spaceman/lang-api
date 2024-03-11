import { ErrorRequestHandler } from 'express'

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('errorHandler', err.stack)

  const statusCode = err.statusCode || 500
  const message = statusCode === 500 ? 'Internal Server Error' : err.message

  // Send response
  res.status(statusCode).json({
    error: {
      message: message,
      status: statusCode,
    },
  })
}

export { errorHandler }
