<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# recipe-web

## Tech stack

- **Framework**: Next.js (App Router, TypeScript)
- **Package manager**: pnpm (use `pnpm`, not `npm`/`yarn`)
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **HTTP client**: Axios
- **State management**: Zustand

## Commands

Run from the repo root — they delegate to the `web` app via pnpm `--filter`.

```bash
pnpm dev      # start dev server
pnpm build    # production build
pnpm start    # run production build
pnpm lint     # eslint across all workspace packages
```

## Repo structure (pnpm workspace)

```
apps/
  web/            # Next.js app (App Router)
packages/
  api/            # @recipe-web/api — axios client + Zod schemas
  ui/             # @recipe-web/ui — shared UI components
```

`apps/web` depends on `@recipe-web/api` and `@recipe-web/ui` via `workspace:*`. Both packages ship raw TypeScript and are transpiled by Next.js (`transpilePackages` in `apps/web/next.config.ts`) — no build step needed.

### apps/web/src/

- `app/` — routes, layouts, pages (App Router)
- `components/` — app-specific UI (not shared with other apps)
- `hooks/` — app-specific React hooks
- `lib/` — app-specific utilities
- `store/` — Zustand stores
- `types/` — app-specific TypeScript types
- `constants/` — app-specific constants

### packages/api/src/

- `client/` — axios instance / API call functions
- `schemas/` — Zod schemas

### packages/ui/src/

- `components/` — shared UI components

These folders are currently placeholders (`.gitkeep`).

## Environment variables

- Real values go in `apps/web/.env.local` (gitignored, never commit).
- `apps/web/.env.example` documents the required keys and is the only env file committed to git.

## Conventions

- @docs/branch-convention.md — branch naming
- @docs/commit-convention.md — commit message rules (enforced by commitlint + husky)
- @docs/code-convention.md — code style

Read these before creating branches or commits.

