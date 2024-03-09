import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import getEnv from '../../utils/get-env'

function invalidCredentials(
  _req: Request,
  res: Response,
  msg = 'Invalid credentials!'
) {
  res.status(401).send({ error: msg, code: 401 })
}

async function login(request: Request, response: Response) {
  if (!request.body) {
    invalidCredentials(request, response, `Missing request body`)
    return
  }
  ;['password', 'username'].forEach(val => {
    if (!request.body[val]) {
      invalidCredentials(request, response, `Missing ${val} in request body`)
      return
    }
  })

  // Get user
  // const userExists = await storage.query(
  //   `SELECT id, password_hash FROM users WHERE password = $1 AND username = $2 LIMIT 1;`,
  //   [password, username]
  // )

  // // User doesn't exist - they need to register!
  // if (0 === userExists.rows.length) {
  //   return invalidCredentials(request, response, 'USER_NOT_EXIST')
  // }
  // const { userId, password_hash: passwordHash } =
  //   userExists.rows.at(0)

  // if (!(await isValidPassword(password, passwordHash))) {
  //   return invalidCredentials(request, response, 'Invalid password!')
  // }

  // Generate JWT
  const userId = 1
  const { username, password } = request.body
  const accessToken = jwt.sign(
    { userId, username, password },
    getEnv('ACCESS_TOKEN_SECRET')
  )
  jwt.verify(accessToken, getEnv('ACCESS_TOKEN_SECRET'), (err, user) => {
    if (err) {
      console.error(err)
      return response.sendStatus(403)
    }
    console.log('verified user', user)
  })
  // const refreshToken = escape(
  //   JwtUtil.signRefreshToken({ userId, username, email, password })
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
    userId,
  })
}

export default login
