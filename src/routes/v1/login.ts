/**
 * user flow:
 * init
 *  - generate sessionId
 *  - return accessToken --> Unauthenticated User
 * register
 *  - store user details
 *  - return accessToken --> Authenticated User
 * login
 *  - validate credentials
 *  - IF sessionId is not the same
 *    - merge usage
 *    - delete user with old sessionId
 *    - update sessionId in accessToken
 *  - return accessToken
 * action
 *   - associate usage with sessionId
 */

import bcrypt from 'bcrypt'

import type {
  Session,
  SessionDb,
  SessionUnauthenticated,
  SessionUser,
  SessionUserUnauthenticated,
  User,
  UserAuthenticated,
  UserUnauthenticated,
} from '../../interfaces/user'
import { InvalidCredentialsError } from '../../utils/error'
import jwt from '../../utils/jwt'
import { getDb, getNextSequence } from '../../db'
import asyncHandler from '../../utils/async-handler'
import { ObjectId } from 'mongodb'
import { getAuthUser } from '../../middleware/auth-middleware'

async function processLogin({
  email,
  password,
  sessionId,
}: {
  email: UserAuthenticated['email']
  password: UserAuthenticated['password']
  sessionId: User['sessionId']
}): Promise<Session> {
  // console.log('login', email, sessionId)
  const db = await getDb()

  // Get user, if exists
  const user = await db
    .collection<UserAuthenticated>('users')
    .findOne({ email })
  const validPassword = await bcrypt.compare(password, user?.password || '')
  if (!user || !validPassword) {
    throw new InvalidCredentialsError('User not found or password not valid')
  }

  // Reconcile session with user
  if (user.sessionId !== sessionId) {
    const deletedSession = await db
      .collection<SessionDb>('sessions')
      .findOneAndDelete({ sessionId })
    console.log('reconcile session for userId', user.id)
    console.log('deleted old session', deletedSession)
    if (deletedSession?.usage.tokens) {
      await db
        .collection<SessionDb>('sessions')
        .updateOne(
          { sessionId: user.sessionId },
          { $inc: { 'usage.tokens': deletedSession.usage.tokens } }
        )
      console.log('merged usage', deletedSession.usage.tokens)
    } else {
      console.log('no usage to merge')
    }
  }
  // const session = await db
  //   .collection<SessionDb>('sessions')
  //   .findOneAndUpdate(
  //     { sessionId },
  //     { $set: { userId: user.id } },
  //     { upsert: true, returnDocument: 'after' }
  //   )
  // console.log('session', session)

  // Update last login
  const updatedUser: UserAuthenticated = { ...user, lastLoginAt: new Date() }
  await db
    .collection<UserAuthenticated>('users')
    .updateOne({ email }, { $set: updatedUser })

  const tokenData: SessionUser = {
    sessionId: user.sessionId,
    isLoggedIn: true,
    id: user.id,
    email,
    name: user.name,
    role: user.role,
  }
  const accessToken = jwt.sign(tokenData)

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

  const userSession: SessionUser = {
    sessionId: user.sessionId,
    id: user.id,
    isLoggedIn: true,
    email: user.email,
    name: user.name,
    role: user.role,
  }

  return { accessToken, user: userSession }
}

const login = asyncHandler(async (request, response) => {
  const user = getAuthUser(request, response)

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

  const payload = await processLogin({
    email,
    password,
    sessionId: user.sessionId,
  })

  response.json(payload)
})

function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Generate and register a new session ID
 */
const postSession = asyncHandler(async (req, res, next) => {
  const sessionId = generateSessionId()

  const db = await getDb()
  const id = await getNextSequence('users')
  await db.collection<UserUnauthenticated>('users').insertOne({
    _id: new ObjectId(),
    id,
    sessionId,
    role: 'guest',
    createdAt: new Date(),
  })

  await db.collection<SessionDb>('sessions').insertOne({
    _id: new ObjectId(),
    sessionId,
    usage: { tokens: 0 },
    createdAt: new Date(),
  })

  const user: SessionUserUnauthenticated = {
    sessionId,
    isLoggedIn: false,
    id,
    role: 'guest',
  }
  const accessToken = jwt.sign(user)
  const data: SessionUnauthenticated = { accessToken, user }

  res.json(data)
})

export { login, processLogin, postSession }
