# Architecture

## Overview

Forge Sprint 02 Kanban is a single Next.js App Router application. Server-rendered routes handle authentication gates, API routes handle integrations and validation, and the interactive board runs as a client component.

```text
Browser
  -> Next.js app routes
  -> NextAuth credentials session
  -> API route handlers
  -> Prisma/PostgreSQL for auth data
  -> Gemini, Slack, and OpenClaw external services
```

## Application Layers

- `src/app` contains App Router pages, route handlers, error boundaries, and the global layout.
- `src/components` contains the dashboard UI, auth form, board controls, modals, task cards, and OpenClaw panel.
- `src/hooks/use-kanban-board.ts` owns client-side board operations and Slack notification triggers.
- `src/lib` contains auth, Prisma, env parsing, API response helpers, route handler wrappers, logging, AI clients, Slack client/server helpers, storage helpers, and validation schemas.
- `src/proxy.ts` applies API rate limits and response security headers.
- `prisma/schema.prisma` defines production database models for users, auth sessions, boards, columns, and tasks.

## Routing

- `/` redirects authenticated users to `/dashboard` and guests to `/login`.
- `/login` and `/signup` render the shared auth form.
- `/dashboard` requires a NextAuth session and renders the Kanban board.
- `/api/auth/[...nextauth]` handles NextAuth session and credentials callbacks.
- `/api/auth/register` creates local credentials accounts.
- `/api/ai/*`, `/api/openclaw/assistant`, and `/api/slack/webhook` are authenticated Node.js route handlers.

## Data Flow

1. The user signs up through `/api/auth/register`.
2. NextAuth signs the user in with the credentials provider and JWT sessions.
3. The dashboard initializes board state from `localStorage` or `src/data/initial-board.ts`.
4. Board changes are validated with Zod and saved back to `localStorage`.
5. Task and board events call the internal Slack webhook route when Slack is configured.
6. AI and OpenClaw routes validate input, call external providers, validate responses, and return JSON to the client.

## Persistence

PostgreSQL is required for auth and is modeled for future board persistence. Current board data is client-side only:

- Auth users, accounts, sessions, and verification tokens use Prisma/PostgreSQL.
- Board, column, and task models exist in Prisma and migrations.
- The active UI stores board collections in browser `localStorage` under versioned keys.

## Security

- Credentials passwords are hashed with `bcryptjs`.
- API routes require `getServerSession` unless they are registration/auth endpoints.
- Zod schemas validate request and integration response payloads.
- `src/proxy.ts` adds CSP, referrer, frame, content-type, and permissions headers.
- API rate limits default to 120 requests per minute, with AI routes defaulting to 30 requests per minute.
- Route handlers add request IDs and structured error payloads.

## Deployment Shape

The app supports two production targets:

- Vercel with `vercel.json`, `npm ci`, and `npm run build`.
- Docker/self-hosting with Next.js standalone output and PostgreSQL.

For multi-instance self-hosting, use a pooled PostgreSQL connection and plan shared cache/session considerations before scaling horizontally.

## Technical Debt

- Move board CRUD from `localStorage` to Prisma-backed route handlers.
- Add end-to-end coverage for authenticated dashboard workflows.
- Add migration automation with release approval gates.
- Add observability sinks for logs, errors, and provider latency.
- Add per-user authorization checks once board persistence moves server-side.
