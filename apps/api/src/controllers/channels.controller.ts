import { Context, Hono, Next } from 'hono'
import { jwt, verify } from 'hono/jwt'
import { Channel } from '../../../shared/interfaces/channels.interface'
import { Role, User } from '../../../shared/interfaces/user.interface'
import {
  createChannel,
  deleteChannel,
  getAllChannels,
  getChannelInformation,
  updateChannel,
} from '../data/channels.data'
import { getUserById } from '../data/user.data'
import { adminMiddleware } from './middleware/admin.middleware'
import { validate } from '../auth/user.auth'

const channelsController = new Hono()

channelsController.use('/test', async (c, next) => {
  return await validate(c, next)
})

channelsController.get('/test', async (c) => {
  return c.text('Test successful')
})

// -- Routes --
/*
  GET / -> Get All Channels
  GET /:id -> Get Channel By ID (With Posts)
  POST / -> Create Channel
  PUT / -> Update Channel
  DELETE / -> Delete Channel
*/

// -------- Get All Channels -- No Auth Required --------
channelsController.get('/', async (c) => {
  const channels = await getAllChannels()
  return c.json(channels)
})

// -------- Get Channel By ID -- No Auth Required --------
channelsController.get('/:name', async (c) => {
  const channelName = c.req.param('name')
  const channel = await getChannelInformation(channelName)
  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404)
  }
  return c.json(channel)
})

// -------- Create Channel -- Auth Required -- Admin Only --------
// JWT Auth
channelsController.use(
  '/',
  jwt({
    secret: Bun.env.JWT_SECRET as string,
    alg: 'HS256',
  }),
)

// User Permissions Check
channelsController.use('/', adminMiddleware)
channelsController.post('/', async (c) => {
  const requestObject = (await c.req.json()) as Channel
  const channel = await createChannel(requestObject)
  return c.json(channel)
})

// -------- Update Channel -- Auth Required -- Admin Only --------
// JWT Auth
channelsController.use(
  '/',
  jwt({
    secret: Bun.env.JWT_SECRET as string,
    alg: 'HS256',
  }),
)

// User Permissions Check
channelsController.use('/', adminMiddleware)
channelsController.put('/', async (c) => {
  const requestObject = (await c.req.json()) as Channel
  const channel = await updateChannel(requestObject)
  return c.json(channel)
})

// -------- Delete Channel -- Auth Required -- Admin Only --------
// JWT Auth
channelsController.use(
  '/',
  jwt({
    secret: Bun.env.JWT_SECRET as string,
    alg: 'HS256',
  }),
)

// User Permissions Check
channelsController.use('/', adminMiddleware)
channelsController.delete('/:id', async (c) => {
  const channelId = c.req.param('id') as string
  const channel = await deleteChannel(channelId)
  return c.json(channel)
})

export default channelsController
