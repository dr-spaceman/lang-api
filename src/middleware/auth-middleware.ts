import type { Request, Response, NextFunction } from 'express'
import jwt from '../utils/jwt'
import { SessionUser } from '../interfaces/user'

type LocalsAuthenticated = {
  user: SessionUser
}

/**
 * Require a valid JWT token to be present in the request headers
 *
 * @returns res.locals.user {SessionUser} - The user object from the JWT
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

  try {
    const user = jwt.verify(token)
    res.locals.user = user
    next()
  } catch (e) {
    console.error(e)
    return res.sendStatus(403)
  }
}

export type { LocalsAuthenticated }
export { authenticateToken }
