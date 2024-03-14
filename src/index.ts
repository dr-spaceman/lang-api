import bodyParser from 'body-parser'
import cors, { CorsOptions } from 'cors'
import 'dotenv/config'
import express from 'express'
import rateLimit from 'express-rate-limit'
import NodeCache from 'node-cache'

import { type User, authenticateToken } from './middleware/auth-middleware'
import { errorHandler } from './middleware/error-middleware'
import login from './routes/v1/login'
import getEnv from './utils/get-env'
import { getDb } from './db'
import { AppError } from './utils/error'

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

app.get('/test-error', async (req, res, next) => {
  try {
    throw new AppError('Test error', 400)
  } catch (err) {
    next(err)
  }
})

app.get('/foo', (req, res, next) => {
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

router.get('/', (req, res) => {
  res.send('Welcome to Lang API v1.0')
})

router.head('/health', (req, res) => {
  res.json({ status: 'ok' })
})

router.post('/login', login)

router.get('/me', authenticateToken, (req, res) => {
  const user = res.locals.user as User
  const key = 'user_' + 1
  let userData: User | undefined = myCache.get(key)

  if (!userData) {
    // Fetch data from database
    userData = {
      id: 1,
      name: 'Gustavo Almodovar',
    }
    myCache.set(key, userData)
  }

  res.json({ ...user, ...userData })
})

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
