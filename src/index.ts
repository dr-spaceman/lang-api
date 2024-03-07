import express from 'express'
import rateLimit from 'express-rate-limit'
import NodeCache from 'node-cache'
import 'dotenv/config'
import { authenticateToken } from './middleware/auth-middleware'

const app = express()
const port = 3000
const router = express.Router()
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 })

app.use(apiLimiter)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// Router for /v1

router.get('/', (req, res) => {
  res.send('API v1 root')
})

router.head('/health', (req, res) => {
  res.json({ status: 'ok' })
})

router.get('/me', authenticateToken, (req, res) => {
  const key = 'user_' + 1
  let userData = myCache.get(key)

  if (!userData) {
    // Fetch data from database
    userData = {
      id: 1,
      name: 'Gustavo Almodovar',
    }
    myCache.set(key, userData)
  }

  res.json(userData)
})

app.use('/v1', router)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
