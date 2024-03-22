import bcrypt from 'bcrypt'
import type { NextFunction, Request, Response } from 'express'

import type { Session, User } from '../../interfaces/user'
import { AppError } from '../../utils/error'
import { getDb, getNextSequence } from '../../db'
import { processLogin } from './login'
import { ObjectId } from 'mongodb'

export class RegistrationError extends AppError {
  constructor(message: string) {
    super(message, 403)
  }
}

async function register(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    if (!request.body) {
      throw new RegistrationError(`Missing request body`)
    }
    ;['password', 'email', 'name'].forEach(val => {
      if (!request.body[val]) {
        throw new RegistrationError(`Missing ${val} in request body`)
      }
    })

    const email = request.body.email.trim()
    const password = request.body.password.trim()
    const name = request.body.name.trim()

    const db = await getDb()

    let session: Session

    // Get user, if exists
    const existingUser = await db.collection<User>('users').findOne({ email })
    if (existingUser) {
      try {
        session = await processLogin(email, password)
      } catch (e) {
        throw new RegistrationError(`User with email ${email} already exists`)
      }
    } else {
      const passwordHash = await bcrypt.hash(password, 10)
      const id = await getNextSequence('users')
      const newUser: User = {
        _id: new ObjectId(),
        id,
        email,
        password: passwordHash,
        name,
        role: 'user',
        usage: { tokens: 0 },
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const res = await db.collection<User>('users').insertOne(newUser)
      if (!res.acknowledged) {
        throw new RegistrationError(`Failed to create user`)
      }

      session = await processLogin(email, password)
    }

    // Send token(s) response
    response.json(session)
  } catch (e) {
    next(e)
  }
}

export { register }
