import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { bootstrapSession, issuePrivateKey, login, logout, me, register, validate } from '../auth/user.auth'

const authController = new Hono()

authController.use('/me', jwt({
  secret: Bun.env.JWT_SECRET as string,
  alg: 'HS256',
}))

authController.post('/session', bootstrapSession)
authController.post('/private-key', issuePrivateKey)
authController.post('/register', register)
authController.post('/login', login)
authController.post('/validate', validate)
authController.post('/logout', logout)
authController.get('/me', me)

export default authController
