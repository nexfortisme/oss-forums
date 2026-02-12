import {Hono, Context} from "hono";
import {register} from "../auth/user.auth";
import { login } from "../auth/user.auth";
import { me } from "../auth/user.auth";
import { validate } from "../auth/user.auth";
import { logout } from "../auth/user.auth";
import { jwt } from "hono/jwt";

const authController = new Hono();

authController.use('/me', jwt({
  secret: Bun.env.JWT_SECRET as string,
  alg: 'HS256',
}));


authController.post('/register', register);
authController.post('/login', login);
authController.post('/validate', validate);
authController.post('/logout', logout);

authController.get('/me', me);


export default authController;
