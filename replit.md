# FarmingHave

A modern farming idle game with X (Twitter) login to save progress and guest mode for casual play.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/farminghave run dev` — run the frontend (port 18287)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind v4, Framer Motion, Clerk Auth
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: Clerk (X/Twitter OAuth, guest mode)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/farminghave/` — React + Vite frontend (game UI)
- `artifacts/api-server/` — Express API server
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/gameSaves.ts` — game_saves table schema
- `artifacts/api-server/src/routes/game.ts` — game save/load endpoints

## Architecture decisions

- Game state is persisted as JSON strings in `game_saves` table (plots, stats, unlockedAchievements)
- Auth is Clerk (cookie-based on web) — no bearer tokens in frontend requests
- Guest mode: all state lives in React state only, no API calls made
- Auto-save runs every 30 seconds for authenticated users
- Clerk proxy middleware at `/api/__clerk` routes auth traffic through the API server

## Product

- Landing screen with "Sign in with X" and "Play as Guest" options
- Full farming game: plant, water, harvest 6 crop types across 12 plots
- 5 quality tiers (Common → Legendary) with 2% legendary chance
- 10 achievements with unlock notifications
- Farm, Shop, and Achievements tabs
- Authenticated users get save/load and auto-save every 30s

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing openapi.yaml
- Clerk publishable key must use `publishableKeyFromHost` — never the raw env var
- CSS layers order matters: `@layer theme, base, clerk, components, utilities` must come before `@import 'tailwindcss'`
- vite.config.ts must use `tailwindcss({ optimize: false })` to prevent broken Clerk UI in production

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
