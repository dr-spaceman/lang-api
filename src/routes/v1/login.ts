import bcrypt from 'bcrypt'
import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import type { User } from '../../interfaces/user'
import { AppError, InvalidCredentialsError } from '../../utils/error'
import getEnv from '../../utils/get-env'
import { getDb } from '../../db'

async function processLogin(
  email: User['email'],
  password: User['password']
): Promise<{ user: User; accessToken: string }> {
  const db = await getDb()

  // Get user, if exists
  const user = await db.collection<User>('users').findOne({ email })
  if (!user) {
    throw new InvalidCredentialsError('User does not exist')
  }
  // console.log('found user', user)
  const updatedUser: User = { ...user, lastLoginAt: new Date() }
  await db.collection<User>('users').updateOne({ email }, { $set: updatedUser })

  // Validate password
  const validPassword = await bcrypt.compare(password, user?.password || '')
  if (!validPassword) {
    throw new InvalidCredentialsError('Invalid password')
  }

  // Generate JWT
  const accessToken = jwt.sign(
    { userId: user.id, email, password },
    getEnv('ACCESS_TOKEN_SECRET')
  )
  jwt.verify(accessToken, getEnv('ACCESS_TOKEN_SECRET'), (err, user) => {
    if (err) {
      console.error(err)
      throw new AppError('Invalid token', 403)
    }
    console.log('verified user token', user)
  })
  // const refreshToken = escape(
  //   JwtUtil.signRefreshToken({ userId, email, email, password })
  // )

  // // @TODO Object cache
  // await storage.query(
  //   `
  //   INSERT INTO refresh_tokens (refresh_token, user_id, user_type)
  //     VALUES ($1, $2, 'ctrl-admin')
  //   ON CONFLICT (user_id, user_type)
  //     DO UPDATE SET refresh_token = $1;
  // `,
  //   [refreshToken, userId]
  // )
  // await storage.query(
  //   `UPDATE users SET last_login = now() WHERE id = $1`,
  //   [userId]
  // )

  return { user, accessToken }
}

async function login(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.body) {
      throw new InvalidCredentialsError(`Missing request body`)
    }
    ;['password', 'email'].forEach(val => {
      if (!request.body[val]) {
        throw new InvalidCredentialsError(`Missing ${val} in request body`)
      }
    })

    const email = request.body.email.trim()
    const password = request.body.password.trim()
    // console.log('login', email, password)

    const { user, accessToken } = await processLogin(email, password)

    // Send token(s) response
    response.json({
      accessToken,
      // refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (e) {
    next(e)
  }
}

export { login, processLogin }
