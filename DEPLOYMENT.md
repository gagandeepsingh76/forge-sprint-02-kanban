# Deployment

## Production Prerequisites

- Node.js 22.
- npm with `package-lock.json`.
- PostgreSQL 17 or a compatible managed PostgreSQL provider.
- Production values from `.env.example`.
- Gemini, Slack, and OpenClaw credentials when those integrations should be active.

## Build Contract

`npm run build` runs `prisma generate && next build`. This keeps Prisma Client current in local builds, GitHub Actions, Docker, and Vercel.

`next.config.ts` uses `output: "standalone"`, so self-hosted production starts with:

```bash
npm run build
npm start
```

`npm start` runs `.next/standalone/server.js`.

## Database Setup

1. Create a PostgreSQL database.
2. Set `DATABASE_URL` to the production connection string.
3. Apply migrations:

```bash
npx prisma migrate deploy
```

Use a pooled connection string for serverless platforms. Keep preview deployments on a separate database when testing migrations.

## Vercel

The project includes `vercel.json` with the Next.js framework preset, `npm ci`, and `npm run build`.

1. Import the repository into Vercel.
2. Add environment variables for Production and Preview.
3. Use a managed PostgreSQL database with pooling.
4. Run `npx prisma migrate deploy` from a controlled release job or local release terminal before promoting schema-dependent code.
5. Deploy from the `main` branch or run:

```bash
npx vercel --prod
```

Vercel detects the `build` script for Next.js projects. NextAuth requires `NEXTAUTH_SECRET`; `NEXTAUTH_URL` may be inferred on Vercel when system environment variables are exposed, but setting it to the canonical production URL is safest for portability.

References:

- Vercel build settings: https://vercel.com/docs/builds/configure-a-build
- Vercel project configuration: https://vercel.com/docs/project-configuration
- Prisma on Vercel: https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel
- NextAuth deployment: https://next-auth.js.org/deployment

## Docker

Local compose stack:

```bash
docker compose up --build
```

Production image:

```bash
docker build -t forge-sprint-02-kanban:latest .
docker run --rm -p 3000:3000 --env-file .env forge-sprint-02-kanban:latest
```

The image uses a multi-stage Node 22 Alpine build and copies Next.js standalone output plus `public` and `.next/static`.

## Gemini

1. Create a Google Gemini API key.
2. Set `GEMINI_API_KEY`.
3. Optionally set `GEMINI_MODEL`; the default is `gemini-3.5-flash`.
4. Validate through `/api/ai/generate-tasks` while signed in.

## Slack

1. Create a Slack incoming webhook for the target workspace/channel.
2. Set `SLACK_WEBHOOK_URL`.
3. Trigger a board or task event from the dashboard.
4. If unset, Slack calls are skipped without blocking board interactions.

## OpenClaw

OpenClaw is optional. The assistant panel works with OpenRouter when `OPENROUTER_API_KEY` is configured.

OpenRouter setup:

1. Create an API key in the OpenRouter dashboard.
2. Set `OPENROUTER_API_KEY` in the deployment environment.
3. Optionally set `OPENROUTER_MODEL`; the default is `~openai/gpt-latest`.
4. Use the dashboard assistant panel while signed in.

OpenClaw gateway setup:

1. Provision an OpenClaw-compatible gateway that accepts `POST /v1/responses`.
2. Set `OPENCLAW_GATEWAY_URL`.
3. Set `OPENCLAW_GATEWAY_TOKEN`; `OPENCLAW_GATEWAY_PASSWORD` is supported as a fallback.
4. Optionally set `OPENCLAW_AGENT_ID` and `OPENCLAW_MODEL`.
5. When both OpenClaw and OpenRouter are configured, OpenClaw is used first.

## Validation

Run before every release:

```bash
npm run lint
npm run build
npm test
```

Optional deployment checks:

```bash
docker compose config
docker build -t forge-sprint-02-kanban:release .
```

## Rollback

- Vercel: promote the previous successful deployment.
- Docker: redeploy the previous image tag.
- Database: prefer forward-only corrective migrations. Restore from backup only after confirming data loss risk and downtime window.
