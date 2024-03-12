import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import getEnv from '../utils/get-env'

type User = {
  id: number
  name: string
}
type LocalsAuthenticated = {
  user: User
}

/**
 * Require a valid JWT token to be present in the request headers
 *
 * @returns res.locals.user {User} - The user object from the JWT
 */
const authenticateToken = (
  req: Request,
  res: Response<LocalsAuthenticated>,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) {
    return res.sendStatus(401)
  }

  jwt.verify(token, getEnv('ACCESS_TOKEN_SECRET'), (err, user) => {
    if (err) {
      console.error(err)
      return res.sendStatus(403)
    }
    res.locals.user = user as User
    next()
  })
}

export type { LocalsAuthenticated, User }
export { authenticateToken }
