import bcrypt from 'bcrypt'
import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import type { User } from '../../interfaces/user'
import { InvalidCredentialsError } from '../../utils/error'
import getEnv from '../../utils/get-env'
import { getDb } from '../../db'

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

    const db = await getDb()

    // Get user, if exists
    const user = await db
      .collection<User>('users')
      .findOne({ email: request.body.email })
    if (!user) {
      throw new InvalidCredentialsError('User does not exist')
    }

    // Validate password
    const validPassword = await bcrypt.compare(
      request.body.password,
      user?.password || ''
    )
    if (!validPassword) {
      throw new InvalidCredentialsError('Invalid password')
    }

    // Generate JWT
    const userId = 1
    const { email, password } = request.body
    const accessToken = jwt.sign(
      { userId, email, password },
      getEnv('ACCESS_TOKEN_SECRET')
    )
    jwt.verify(accessToken, getEnv('ACCESS_TOKEN_SECRET'), (err, user) => {
      if (err) {
        console.error(err)
        return response.sendStatus(403)
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

    // Send token(s) response
    response.json({
      accessToken,
      // refreshToken,
      user: { id: userId, email },
    })
  } catch (e) {
    next(e)
  }
}

export default login
