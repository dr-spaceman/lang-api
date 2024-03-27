import bcrypt from 'bcrypt'
import z from 'zod'

import type { Session, UserAuthenticated } from '../../interfaces/user'
import { AppError } from '../../utils/error'
import { getDb } from '../../db'
import { processLogin } from './login'
import asyncHandler from '../../utils/async-handler'
import { getAuthUser } from '../../middleware/auth-middleware'

export class RegistrationError extends AppError {
  constructor(message: string) {
    super(message, 403)
  }
}

const register = asyncHandler(async (request, response) => {
  try {
    const { sessionId } = getAuthUser(request, response)

    if (!request.body) {
      throw `Missing request body`
    }
    ;['password', 'email', 'name'].forEach(val => {
      if (!request.body[val]) {
        throw `Missing ${val} in request body`
      }
    })

    const email = request.body.email.trim() as string
    const password = request.body.password.trim() as string
    const name = request.body.name.trim() as string

    console.log('register', sessionId, email, name)

    // Validate formats
    try {
      z.string().email().parse(email)
    } catch (e) {
      throw `Invalid email format`
    }

    const db = await getDb()
    let session: Session

    const existingUser = await db
      .collection<UserAuthenticated>('users')
      .findOne({ email })
    if (existingUser) {
      console.log('existing user', existingUser)
      try {
        session = await processLogin({ email, password, sessionId })
      } catch (e) {
        throw `Registration error: User with email ${email} may already exist`
      }
    } else {
      const passwordHash = await bcrypt.hash(password, 10)
      const user: Partial<UserAuthenticated> = {
        email,
        password: passwordHash,
        name,
        role: 'user',
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      }
      const res = await db
        .collection<UserAuthenticated>('users')
        .findOneAndUpdate({ sessionId }, { $set: user })
      if (!res) {
        throw `Failed to create authenticated user`
      }

      session = await processLogin({ email, password, sessionId })
    }

    // Send token(s) response
    response.json(session)
  } catch (e: unknown) {
    throw new RegistrationError(String(e))
  }
})

export { register }
