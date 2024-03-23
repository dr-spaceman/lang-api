import bodyParser from 'body-parser'
import cors, { CorsOptions } from 'cors'
import 'dotenv/config'
import express from 'express'
import rateLimit from 'express-rate-limit'
import NodeCache from 'node-cache'

import {
  authenticateToken,
  getAuthUser,
  verifyAdmin,
} from './middleware/auth-middleware'
import { errorHandler } from './middleware/error-middleware'
import {
  login,
  register,
  getMyUsage,
  getUserUsage,
  putUsage,
} from './routes/v1'
import getEnv from './utils/get-env'
import { getDb } from './db'
import { AppError } from './utils/error'
import jwt from './utils/jwt'
import { SessionUser, User } from './interfaces/user'
import asyncHandler from './utils/async-handler'

const app = express()
const port = Number(getEnv('PORT', '3333'))
const router = express.Router()
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 100 requests per windowMs
  skipSuccessfulRequests: true,
})
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 })
const whitelist = ['http://localhost:3000', 'https://vietnamease.vercel.app']
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
}

// app.set('trust proxy', 6)

app.use(apiLimiter)
app.use(bodyParser.json())

// Debugging
// app.get('/ip', (request, response) => response.send(request.ip))
// app.get('/x-forwarded-for', (request, response) =>
//   response.send(request.headers['x-forwarded-for'])
// )

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/docs', (req, res) => {
  // TODO
  res.send('Docs')
})

// Tests

app.get(
  '/jwt',
  asyncHandler(async (req, res) => {
    const token = jwt.verify('fuuu')
    res.json(token)
  })
)

app.get(
  '/test-error',
  asyncHandler(async (req, res, next) => {
    throw new AppError('Test error', 400)
  })
)

app.get('/db', (req, res, next) => {
  getDb().then(db => {
    db.collection<{ _id: string }>('foo')
      .findOneAndUpdate(
        { _id: 'foo' },
        { $inc: { numFoos: 1 } },
        { upsert: true, returnDocument: 'after' }
      )
      .then(result => {
        res.json(result)
      })
      .catch(next)
  })
})

// Router for /v1

router.get('/', (req, res) => {})

router.head('/health', (req, res) => {
  res.json({ status: 'ok' })
})

router.post('/login', login)

router.post('/users', register)

router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = getAuthUser(req, res, next)
    console.log('auth user', user)
    const key = 'user_' + user.id
    let userData: User | undefined = myCache.get(key)

    if (!userData) {
      const db = await getDb()
      const foundUser = await db
        .collection<User>('users')
        .findOne({ id: user.id })
      if (!foundUser) {
        throw new AppError('User not found', 404)
      }
      userData = foundUser
      myCache.set(key, userData)
    }

    res.json({ ...user, ...userData })
  } catch (e) {
    next(e)
  }
})

// Get auth user's usage
router.get('/usage', authenticateToken, getMyUsage)
// Get specific user's usage
router.get('/usage/:userId', authenticateToken, verifyAdmin, getUserUsage)
// Register new usage
router.put('/usage', authenticateToken, putUsage)

router.get('/translate')
router.get('/make-cards')
// Get auth user's cards
router.get('/cards')
// Backup auth user's cards
router.put('/cards')

app.use('/v1', cors(corsOptions), router)

// app.get('/error', (req, res) => {
//   throw new Error('Test error')
// })
app.use(errorHandler)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
