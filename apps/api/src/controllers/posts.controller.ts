import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { createPost, deletePost, getPostInformation, updatePost } from "../data/posts.data";
import { getCurrentUserId } from "../auth/user.auth";
import { postOwnershipMiddleware } from "./middleware/post-ownership.middleware";

const postsController = new Hono();

/*
  GET /:id    -> Get Post By ID (With Comments) — public
  POST /      -> Create Post                    — auth required
  PUT /:id    -> Edit Post                      — auth required + ownership
  DELETE /:id -> Delete Post                    — auth required + ownership
*/

// -------- Get Post By ID (With Comments) -- No Auth Required --------
postsController.get('/:id', async (c) => {
  const postId = c.req.param('id')
  const post = await getPostInformation(postId)
  if (!post) {
    return c.json({ error: 'Post not found' }, 404)
  }
  return c.json(post)
})

// -------- Create Post -- Auth Required --------
postsController.post(
  '/',
  jwt({ secret: Bun.env.JWT_SECRET as string, alg: 'HS256' }),
  async (c) => {
    const requestBody = await c.req.json()

    const currentUserId = await getCurrentUserId(c)
    if (!currentUserId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    requestBody.author_id = currentUserId

    const post = await createPost(requestBody)
    if (!post) {
      return c.json({ error: 'Failed to create post' }, 500)
    }
    return c.json(post)
  },
)

// -------- Edit Post -- Auth Required + Ownership --------
postsController.put(
  '/:id',
  jwt({ secret: Bun.env.JWT_SECRET as string, alg: 'HS256' }),
  postOwnershipMiddleware,
  async (c) => {
    const postId = c.req.param('id')
    const { title, body } = await c.req.json()
    if (!body) {
      return c.json({ error: 'Body is required' }, 400)
    }
    const updated = await updatePost(postId, title ?? '', body)
    if (!updated) {
      return c.json({ error: 'Post not found or failed to update' }, 404)
    }
    return c.json(updated)
  },
)

// -------- Delete Post -- Auth Required + Ownership --------
postsController.delete(
  '/:id',
  jwt({ secret: Bun.env.JWT_SECRET as string, alg: 'HS256' }),
  postOwnershipMiddleware,
  async (c) => {
    const postId = c.req.param('id')
    const deleted = await deletePost(postId)
    return c.json(deleted)
  },
)

export default postsController;
