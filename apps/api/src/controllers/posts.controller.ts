import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { createPost, deletePost, getPostInformation } from "../data/posts.data";
import { getCurrentUserId } from "../auth/user.auth";

const postsController = new Hono();

/*
  GET /:id -> Get Post By ID (With Comments)
  POST / -> Create Post
  DELETE /:id -> Delete Post
*/

// -------- Get Post By ID (With Comments) -- No Auth Required --------
postsController.get('/:id', async (c) => {
  const postId = c.req.param('id')
  const post = await getPostInformation(postId)
  return c.json(post)
})

// -------- Create Post -- Auth Required --------
postsController.use('/', jwt({
  secret: Bun.env.JWT_SECRET as string,
  alg: 'HS256',
}));

postsController.post('/', async (c) => {

  console.log('Creating post')

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
})

// -------- Delete Post -- Auth Required --------

postsController.use('/:id', jwt({
  secret: Bun.env.JWT_SECRET as string,
  alg: 'HS256',
}));
postsController.delete('/:id', async (c) => {
  const postId = c.req.param('id')
  const deleted = await deletePost(postId)
  return c.json(deleted)
})

export default postsController;
