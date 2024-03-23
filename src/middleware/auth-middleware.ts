import type { Request, Response, NextFunction } from 'express'
import jwt from '../utils/jwt'
import { SessionUser, User } from '../interfaces/user'
import { AppError } from '../utils/error'
import asyncHandler from '../utils/async-handler'

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

const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = res.locals.user as User
  // console.log('verifyAdmin', user.role === 'admin', user)
  if (user.role !== 'admin') {
    return res.sendStatus(403)
  }
  next()
}

export type { LocalsAuthenticated }
export { authenticateToken, getAuthUser, verifyAdmin }
