import { Context, Next } from "hono"
import { verify } from "hono/jwt"
import { User, Role } from "../../../../shared/interfaces/user.interface"
import { getUserById } from "../../data/user.data"

export const adminMiddleware = async (c: Context, next: Next) => {
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

  // Checking if the user is an admin
  if (user.role !== Role.ADMIN) {
    return c.json({ error: 'You are not authorized to create a channel' }, 403)
  }

  // Continuing to the next middleware
  await next()
};
