import { Channel, ChannelResponseObject } from '../../../shared/interfaces/channels.interface'
import { Post } from '../../../shared/interfaces/post.interface'
import { db } from '../persistance/database'
import { getAllPostsForChannel } from './posts.data'

export const createChannel = async (channel: Channel) => {
  const channelId = Bun.randomUUIDv7()

  const newChannel = await db
    .query(
      'INSERT INTO channels (id, name, description, accent, guidelines) VALUES (?, ?, ?, ?, ?)',
    )
    .run(
      channelId,
      channel.name,
      channel.description,
      channel.accent,
      channel.guidelines ? JSON.stringify(channel.guidelines) : '[]',
    )
  return getChannelById(channelId)
}

export const updateChannel = async (channel: Channel) => {
  const updatedChannel = await db
    .query('UPDATE channels SET description = ?, accent = ?, guidelines = ? WHERE id = ?')
    .run(
      channel.description,
      channel.accent,
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

export const getChannelById = async (channelId: string) => {
  const channel = await db
    .query('SELECT * FROM channels WHERE id = ? AND deleted = FALSE')
    .get(channelId)

  if (!channel) {
    return null
  }

  return channel as Channel
}

export const getChannelInformation = async (channelId: string) => {
  let responseObject: ChannelResponseObject = {
    channel: null,
    posts: [],
  }

  const channel = await getChannelById(channelId)
  if (!channel) {
    return null
  }

  responseObject.channel = channel as Channel

  const posts = (await getAllPostsForChannel(channelId)) as Post[]
  responseObject.posts = posts

  return responseObject
}
