# oss-forums

Monorepo with a Vue + Vite frontend and a Hono + Bun backend.

## Demo Site

See an example of the app deployed [HERE](https://oss-forums.nexfortisme.com/channels)

## Layout

- `apps/web`: Vite + Vue app
- `apps/api`: Hono API running on Bun
- `packages/shared`: optional shared code (types, utilities)

## Project Setup

```sh
bun install
```

## Development

Run both frontend and backend:

```sh
bun run dev
```

Run only one side:

```sh
bun run dev:web
bun run dev:api
```

## Web App (apps/web)

```sh
cd apps/web
bun dev
bun run build
bun test:unit
bun lint
```

## API (apps/api)

```sh
cd apps/api
bun run dev
bun run start
```
