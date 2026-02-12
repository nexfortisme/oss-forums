import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { login, logout, me, register, validate } from './auth/user.auth'
import { initDatabase } from './persistance/database'
import { getUserById } from './data/user.data'
import { jwt } from 'hono/jwt'
import {
  createChannel,
  deleteChannel,
  getAllChannels,
  getChannelById,
  updateChannel,
} from './data/channels.data'
import { Channel } from '../../shared/interfaces/channels.interface'
import authController from './controllers/auth.controller'
import userController from './controllers/user.controller'
import channelsController from './controllers/channels.controller'
import { logger } from 'hono/logger'
import postsController from './controllers/posts.controller'

initDatabase()

const app = new Hono()

const frontendOrigins = Bun.env.FRONTEND_ORIGIN?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean) ?? ['http://localhost:5173', 'http://localhost:4173']

const port = Number(Bun.env.BACKEND_PORT ?? 12345)

app.use(
  '*',
  cors({
    origin: frontendOrigins,
    allowHeaders: ['Content-Type'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  }),
)

app.use('*', logger())

// app.get("/users/:id", async (c) => {
//   const userId = c.req.param("id");
//   let user = await getUserById(userId);
//   if (!user) {
//     return c.json({ error: "User not found" }, 404);
//   }

//   user.password_hash = undefined;
//   user.password_salt = undefined;

//   return c.json(user);
// });

app.route('/auth', authController)
app.route('/channels', channelsController)
app.route('/posts', postsController)
app.route('/users', userController)

Bun.serve({
  fetch: app.fetch,
  port,
})

export default app
