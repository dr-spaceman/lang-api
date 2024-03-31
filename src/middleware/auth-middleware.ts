import type { Request, Response, NextFunction } from 'express'
import jwt from '../utils/jwt'
import { SessionUser } from '../interfaces/user'
import { AppError } from '../utils/error'

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
    next(e)
  }
}

/**
 * Middleware to authorize authenticated user
 *
 * @requires authenticateToken Requires auth middleware to be called first
 */
const authorizeAuthenticatedUser = (
  req: Request,
  res: Response<LocalsAuthenticated>,
  next: NextFunction
) => {
  const user = getAuthUser(req, res)
  if (!user.isLoggedIn) {
    next(
      new AppError(
        'This action required authenticated user; Please sign in.',
        403
      )
    )
    return
  }

  next()
}

/**
 * Middleware to authorize only admins
 *
 * @requires authenticateToken Requires auth middleware to be called first
 */
const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = getAuthUser(req, res)
  // console.log('verifyAdmin', user.role === 'admin', user)
  if (user?.role !== 'admin') {
    next(new AppError('This action requires admin privileges.', 403))
    return
  }

  next()
}

/**
 * Get the authenticated user from the request, or throw an error
 *
 * @requires authenticateToken Requires auth middleware to be called first
 */
const getAuthUser = (
  req: Request,
  res: Response,
  next?: NextFunction
): SessionUser => {
  const user: SessionUser = res.locals.user
  if (!user) {
    throw new AppError('No user found in request', 400)
  }

  return user
}

export type { LocalsAuthenticated }
export {
  authenticateToken,
  authorizeAdmin,
  authorizeAuthenticatedUser,
  getAuthUser,
}
