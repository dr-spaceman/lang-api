import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'

import { SessionUser, User, UserUsage } from '../../interfaces/user'
import { AppError } from '../../utils/error'
import asyncHandler from '../../utils/async-handler'
import { getDb } from '../../db'
import { getAuthUser } from '../../middleware/auth-middleware'

async function getUsage(userId: User['id']): Promise<UserUsage> {
  const db = await getDb()
  const user = await db.collection<User>('users').findOne({ id: userId })
  if (!user) {
    throw new AppError('User not found', 404)
  }

  return user.usage
}

/**
 * Get auth user's usage
 *
 * @sends {UserUsage} Auth user's usage
 */
const getMyUsage = asyncHandler(async (req, res, next) => {
  const sessionUser = getAuthUser(req, res)
  const usage = await getUsage(sessionUser.id)

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
  const usage = await getUsage(userId)

  res.send(usage)
})

/**
 * Update user's usage
 *
 * @sends {UserUsage} Updated usage
 */
async function putUsage(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthUser(req, res, next)
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
    const result = await db.collection<User>('users').findOneAndUpdate(
      { id: user.id },
      {
        $inc: { 'usage.tokens': tokens },
      },
      { returnDocument: 'after' }
    )
    if (!result || !result.usage) {
      throw new AppError('Could not update user', 500)
    }

    res.send(result.usage)
  } catch (e) {
    next(e)
  }
}

export { getMyUsage, getUserUsage, putUsage }
