import bodyParser from 'body-parser'
import cors, { CorsOptions } from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import NodeCache from 'node-cache'

import { User, authenticateToken } from './middleware/auth-middleware'
import login from './routes/vi/login'

const app = express()
const port = 3000
const router = express.Router()
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 })
const whitelist = ['http://localhost:3000']
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
}

app.use(apiLimiter)
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/docs', (req, res) => {
  // TODO
  res.send('Docs')
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

app.use('/v1', cors(corsOptions), router)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
