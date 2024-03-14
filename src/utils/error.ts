export class AppError extends Error {
  statusCode: number
  status: string

  constructor(message: string, statusCode: number = 500) {
    super(message) // Add a "message" property
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = 'Invalid credentials') {
    super(message, 401)
  }
}
