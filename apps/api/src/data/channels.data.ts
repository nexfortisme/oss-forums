import { Channel, ChannelResponseObject } from '../../../shared/interfaces/channels.interface'
import { Post } from '../../../shared/interfaces/post.interface'
import { db } from '../persistance/database'
import { getAllPostsForChannel } from './posts.data'

const getChannelById = async (channelId: string): Promise<Channel | null> => {
  const channel = await db
    .query('SELECT * FROM channels WHERE id = ? AND deleted = FALSE')
    .get(channelId)

  if (!channel) {
    return null
  }

  return channel as Channel
}

export const getChannelByName = async (channelName: string): Promise<Channel | null> => {
  const channel = await db
    .query('SELECT * FROM channels WHERE name = ? AND deleted = FALSE')
    .get(channelName)

  if (!channel) {
    return null
  }

  return channel as Channel
}

export const createChannel = async (channel: Channel) => {
  const channelId = Bun.randomUUIDv7()

  try {
    const newChannel = await db
      .query(
        'INSERT INTO channels (id, name, description, accent, guidelines) VALUES (?, ?, ?, ?, ?)',
      )
      .run(
        channelId,
        channel.name,
        channel.description,
        channel.accent ?? null,
        channel.guidelines ? JSON.stringify(channel.guidelines) : '[]',
      )
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed: channels.name')) {
      return {
        id: '',
        name: '',
        description: '',
        accent: '',
        guidelines: [],
        errors: 'Channel name already exists',
      } as Channel
    }
    console.error('Error creating channel', error)
    return {
      id: '',
      name: '',
      description: '',
      accent: '',
      guidelines: [],
      errors: 'Error creating channel',
    } as Channel
  }

  return getChannelById(channelId)
}

export const updateChannel = async (channel: Channel) => {
  const updatedChannel = await db
    .query('UPDATE channels SET description = ?, accent = ?, guidelines = ? WHERE id = ?')
    .run(
      channel.description,
      channel.accent ?? null,
      channel.guidelines ? JSON.stringify(channel.guidelines) : '[]',
      channel.id,
    )

  if (updatedChannel.changes === 0) {
    return null
  }

  return getChannelById(channel.id)
}

export const deleteChannel = async (channelId: string) => {
  const deletedChannel = await db
    .query('UPDATE channels SET deleted = TRUE, deleted_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(channelId)

  if (deletedChannel.changes === 0) {
    return false
  }

  return true
}

export const getAllChannels = async () => {
  const channels = await db.query('SELECT * FROM channels WHERE deleted = FALSE').all()
  return channels
}

export const getChannelInformation = async (channelName: string) => {
  let responseObject: ChannelResponseObject = {
    channel: null,
    posts: [],
  }

  const channel = await getChannelByName(channelName)
  if (!channel) {
    return null
  }

  responseObject.channel = channel as Channel

  const posts = (await getAllPostsForChannel(channelName)) as Post[]
  responseObject.posts = posts

  return responseObject
}
