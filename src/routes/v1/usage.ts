import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'

import { SessionDb, SessionUser, Usage, User } from '../../interfaces/user'
import { AppError } from '../../utils/error'
import asyncHandler from '../../utils/async-handler'
import { getDb } from '../../db'
import { getAuthUser } from '../../middleware/auth-middleware'

async function getUsage(sessionId: User['sessionId']): Promise<Usage> {
  const db = await getDb()
  const sessions = await db.collection<SessionDb>('sessions').find({}).toArray()
  console.log('sessions', sessions)
  const session = await db
    .collection<SessionDb>('sessions')
    .findOne({ sessionId })
  if (!session) {
    throw new AppError('Session ID not found', 404)
  }

  return session.usage ?? { tokens: 0 }
}

/**
 * Get auth user's usage
 *
 * @sends {Usage} Auth user's usage
 */
const getMyUsage = asyncHandler(async (req, res, next) => {
  const sessionUser = getAuthUser(req, res)
  const usage = await getUsage(sessionUser.sessionId)

  res.send(usage)
})

/**
 * Get a user's usage
 *
 * @sends {UserUsage} User's usage
 */
const getUserUsage = asyncHandler(async (req, res) => {
  const userId = req.params.userId ? Number(req.params.userId) : undefined
  if (!userId) {
    throw new AppError('Missing userId', 400)
  }
  const db = await getDb()
  const user = await db.collection<User>('users').findOne({ id: userId })
  if (!user) {
    throw new AppError('User not found', 404)
  }
  console.log('user', user)
  const usage = await getUsage(user.sessionId)

  res.send(usage)
})

/**
 * Update user's usage
 *
 * @sends {UserUsage} Updated usage
 */
const putUsage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = getAuthUser(req, res, next)
    try {
      const Body = z.object({
        tokens: z.number(),
      })
      Body.parse(req.body)
    } catch (e) {
      console.error(e)
      throw new AppError(`Missing tokens in request body`, 400)
    }

    const tokens = Number(req.body.tokens)

    const db = await getDb()
    const result = await db.collection<SessionDb>('sessions').findOneAndUpdate(
      { sessionId },
      {
        $inc: { 'usage.tokens': tokens },
      },
      { returnDocument: 'after' }
    )
    console.log('result', result)
    if (!result || !result.usage) {
      throw new AppError('Could not update user', 500)
    }

    res.send(result.usage)
  }
)

export { getMyUsage, getUserUsage, putUsage }
