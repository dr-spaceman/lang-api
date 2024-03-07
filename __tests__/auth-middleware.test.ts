import express from 'express'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import 'dotenv/config'

import { authenticateToken } from '../src/middleware/auth-middleware'
import getEnv from '../src/utils/get-env'

const app = express()
app.use(express.json())
app.get('/protected', authenticateToken, (req, res) => {
  res.send('Access granted')
})

describe('Authentication Middleware', () => {
  it('allows access with a valid token', async () => {
    const signedToken = jwt.sign(
      { user: 'test' },
      getEnv('ACCESS_TOKEN_SECRET')
    )
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer ' + signedToken)
    expect(response.statusCode).toBe(200)
    expect(response.text).toBe('Access granted')
  })

  it('denies access with an invalid token', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid_token')
    expect(response.statusCode).toBe(403)
  })

  it('denies access with no token', async () => {
    const response = await request(app).get('/protected')
    expect(response.statusCode).toBe(401)
  })
})
