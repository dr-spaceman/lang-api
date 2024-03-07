import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import getEnv from '../utils/get-env'

const ACCESS_TOKEN_SECRET = getEnv('ACCESS_TOKEN_SECRET')

export const authenticateToken = (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) {
    return res.sendStatus(401)
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403)
    }
    req.user = user
    next()
  })
}
