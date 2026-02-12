import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { getUserById } from "../data/user.data";


const userController = new Hono();

userController.use('/:id', jwt({
  secret: Bun.env.JWT_SECRET as string,
  alg: 'HS256',
}));

userController.get('/:id', async (c) => {
  const userId = c.req.param("id");
  const user = await getUserById(userId);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }
  user.password_hash = undefined;
  user.password_salt = undefined;
  return c.json(user);
});

export default userController;
