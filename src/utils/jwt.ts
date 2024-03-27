import jwt from 'jsonwebtoken'
import { SessionUser } from '../interfaces/user'
import { AppError } from './error'
import getEnv from './get-env'

const ACCESS_TOKEN_SECRET = getEnv('ACCESS_TOKEN_SECRET')

function sign(sessionUser: SessionUser) {
  const accessToken = jwt.sign(sessionUser, ACCESS_TOKEN_SECRET)

  return accessToken
}

function verify(accessToken: string): SessionUser {
  try {
    const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET)

    return decoded as SessionUser
  } catch (e) {
    console.error(e)
    throw new AppError('Invalid token', 403)
  }
}

export default { sign, verify }
