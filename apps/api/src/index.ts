import { Hono } from "hono";

const app = new Hono();

// Init DB

app.get("/health", (c) => c.json({ ok: true }));

const port = Number(Bun.env.BACKEND_PORT ?? 12345);


Bun.serve({
  fetch: app.fetch,
  port
});

export default app;
