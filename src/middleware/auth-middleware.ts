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
