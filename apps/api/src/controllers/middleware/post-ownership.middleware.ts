import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { Role, User } from "../../../../shared/interfaces/user.interface";
import { getPostById } from "../../data/posts.data";
import { getUserById } from "../../data/user.data";

export const postOwnershipMiddleware = async (c: Context, next: Next) => {
  // Checking for token, shouldn't ever be the case to the middleware chain, but better safe than sorry
  let userToken = c.req.header('Authorization') as string
  if (!userToken) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  userToken = userToken.split(' ')[1]

  // Verifying the token
  const decoded = (await verify(userToken, Bun.env.JWT_SECRET as string, 'HS256')) as { iss: string, exp: number, user: string }
  if (!decoded) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  console.log('Decoded Token', decoded)

  // Getting the user object from the token
  const userObject = JSON.parse(decoded.user) as unknown as User
  if (!userObject) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Getting the user object from the database
  const user = await getUserById(userObject.id)
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Admins can do anything
  if(user.role === Role.ADMIN) {
    // Continuing to the next middleware
    await next()
    return
  }

  // Getting the post id from the request
  const postId = c.req.param('id')
  const post = await getPostById(postId)
  if (!post) {
    return c.json({ error: 'Post not found' }, 404)
  }

  // Checking if the user is the owner of the post
  if(post.author_id !== user.id) {
    return c.json({ error: 'You are not authorized to delete this post' }, 403)
  }

  // Continuing to the next middleware
  await next()
};
