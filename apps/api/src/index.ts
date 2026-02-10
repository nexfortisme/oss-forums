import { Hono } from "hono";
import { cors } from "hono/cors";
import { login, logout, me, register, validate } from "./auth/user.auth";
import { initDatabase } from "./persistance/database";
import { getUserById } from "./data/user.data";
import { jwt } from "hono/jwt";

initDatabase();

const app = new Hono();

const frontendOrigins = Bun.env.FRONTEND_ORIGIN?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [
  "http://localhost:5173",
  "http://localhost:4173",
];

app.use(
  "*",
  cors({
    origin: frontendOrigins,
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  }),
);

app.use("/users/:id", jwt({
  secret: Bun.env.JWT_SECRET as string,
  alg: 'HS256',
}));

app.get("/users/:id", async (c) => {
  const userId = c.req.param("id");
  let user = await getUserById(userId);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  user.password_hash = undefined;
  user.password_salt = undefined;

  return c.json(user);
});

app.get("/health", (c) => c.json({ ok: true }));
app.post("/auth/register", register);
app.post("/auth/login", login);
app.post("/auth/logout", logout);
app.get("/auth/validate", validate);
app.get("/auth/me", me);

const port = Number(Bun.env.BACKEND_PORT ?? 12345);


Bun.serve({
  fetch: app.fetch,
  port
});

export default app;
