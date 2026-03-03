import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import authController from './controllers/auth.controller'
import channelsController from './controllers/channels.controller'
import postsController from './controllers/posts.controller'
import commentsController from './controllers/comments.controller'
import userController from './controllers/user.controller'
import { ensureInitialAdminUser } from './bootstrap/admin.bootstrap'
import { seedDemoData } from './bootstrap/seed.bootstrap'
import { initDatabase } from './persistance/database'

initDatabase()
await ensureInitialAdminUser()
seedDemoData()

const app = new Hono()

const frontendOrigins = Bun.env.FRONTEND_ORIGIN?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean) ?? ['http://localhost:5173', 'http://localhost:4173']

console.log('frontendOrigins', frontendOrigins)

const port = Number(Bun.env.BACKEND_PORT ?? 12345)

// apps/api/src/index.ts
app.use(
  '*',
  cors({
    origin: frontendOrigins,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT', 'PATCH'],
    credentials: true,
  }),
)

app.use('*', logger())

app.route('/auth', authController)
app.route('/channels', channelsController)
app.route('/posts', postsController)
app.route('/comments', commentsController)
app.route('/users', userController)

Bun.serve({
  fetch: app.fetch,
  port,
})

export default app
