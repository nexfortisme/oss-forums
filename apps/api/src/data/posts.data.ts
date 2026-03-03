import { PostComments } from '../../../shared/interfaces/comments.interface'
import { Post, PostResponseObject } from '../../../shared/interfaces/post.interface'
import { db } from '../persistance/database'
import { getChannelByName } from './channels.data'
import { getPostComments } from './comments.data'

// Create
export const createPost = async (post: Post) => {
  console.log('Creating post', post)
  const postId = Bun.randomUUIDv7()
  const newPost = await db
    .query('INSERT INTO posts (id, channel_id, author_id, title, body) VALUES (?, ?, ?, ?, ?)')
    .run(postId, post.channel_id, post.author_id, post.title ?? '', post.body)
  if (newPost.changes === 0) {
    return null
  }
  return getPostById(postId)
}

// Get All For Channel
export const getAllPostsForChannel = async (channelName: string) => {
  const channel = await getChannelByName(channelName)
  if (!channel) {
    return null
  }
  const posts = await db
    .query('SELECT * FROM posts WHERE channel_id = ? AND deleted = FALSE ORDER BY created_at DESC')
    .all(channel.id)
  return posts
}

// Get By ID
export const getPostById = async (postId: string): Promise<Post | null> => {
  const post = await db.query('SELECT * FROM posts WHERE id = ? AND deleted = FALSE').get(postId)

  if (!post) {
    return null
  }

  return post as Post
}

export const getPostInformation = async (postId: string) => {
  let responseObject: PostResponseObject = {
    post: null,
    comments: [],
  }

  const post = await getPostById(postId)
  if (!post) {
    return null
  }

  responseObject.post = post as Post

  const comments = await getPostComments(postId)
  if (!comments) {
    responseObject.comments = null
  }

  responseObject.comments = comments as PostComments[]

  return responseObject
}

export const updatePost = async (postId: string, title: string, body: string): Promise<Post | null> => {
  const result = await db
    .query('UPDATE posts SET title = ?, body = ? WHERE id = ? AND deleted = FALSE')
    .run(title, body, postId)
  if (result.changes === 0) {
    return null
  }
  return getPostById(postId)
}

export const deletePost = async (postId: string) => {
  const post = await db
    .query('UPDATE posts SET deleted = TRUE, deleted_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(postId)
  return post
}
