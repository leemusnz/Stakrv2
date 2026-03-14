# AGENT-TOOLS.md — Stakr Engineering

## Workspace
- **Path:** `/data/workspace/workspace-stakr/`
- **Repo:** `https://github.com/leemusnz/Stakrv2.git`
- **Branch:** `main`
- **Stack:** Next.js, Neon PostgreSQL, Drizzle ORM, NextAuth, Radix UI, Tailwind CSS, Stripe

## ⚠️ CRITICAL: Git Identity

Before ANY git commit, you MUST run:
```bash
git config user.name "Leemus"
git config user.email "leejmckenzie@gmail.com"
```

**Vercel BLOCKS deploys from unrecognised git emails.**
NEVER commit as STAX, KIP, NEXUS, or any agent name. Always commit as Leemus.

## Workflow

1. `git pull --rebase origin main` (sync first)
2. Make changes
3. `npm run lint` (fix any errors)
4. `npm run type-check` (fix any errors)
5. Set git identity (see above)
6. `SKIP_PRE_COMMIT=1 git commit -m "fix/chore: description" --no-verify`
7. Auto-push cron handles pushing to GitHub

## Key Directories

- `app/` — Next.js app router (pages + API routes)
- `components/` — 173 React components
- `lib/` — Shared utilities, DB, auth
- `hooks/` — Custom React hooks
- `migrations/` — SQL migrations
- `tests/` — Test files
- `docs/` — Documentation
- `public/` — Static assets

## Database

- **ORM:** Drizzle
- **Provider:** Neon PostgreSQL
- **Schema:** `database-schema.sql` (reference), `lib/db/` (Drizzle schema)
- **Config:** `drizzle.config.ts`

## Testing

- `npm test` — Run Jest unit tests
- `npm run test:e2e` — Playwright e2e tests
- `npm run type-check` — TypeScript type checking

## Rules

- No new features — focus on polish, testing, security, UX
- Fix lint/typecheck errors before committing
- Keep commits small and focused
- Always pull before committing to avoid conflicts
