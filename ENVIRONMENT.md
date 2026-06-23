# Environment

Copy `.env.example` to `.env.local` for development. Production secrets should be managed by the deployment platform, not committed.

## Variables

| Variable | Required in production | Default | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | Set by Next.js commands and hosting platforms. |
| `DATABASE_URL` | Yes | Local Postgres URL | PostgreSQL connection string used by Prisma. Use pooling in serverless deployments. |
| `NEXTAUTH_SECRET` | Yes | None | At least 32 characters. Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Yes for non-Vercel | None | Canonical app URL, for example `https://kanban.example.com`. |
| `GEMINI_API_KEY` | No | None | Enables Gemini AI routes. Routes return `503` when missing. |
| `GEMINI_MODEL` | No | `gemini-3.5-flash` | Model passed to the Gemini interactions API. |
| `SLACK_WEBHOOK_URL` | No | None | Enables Slack incoming webhook delivery. Missing value returns skipped Slack results. |
| `OPENCLAW_GATEWAY_URL` | No | None | Base URL for the OpenClaw-compatible gateway. |
| `OPENCLAW_GATEWAY_TOKEN` | No | None | Bearer token for OpenClaw. |
| `OPENCLAW_GATEWAY_PASSWORD` | No | None | Legacy fallback when `OPENCLAW_GATEWAY_TOKEN` is unset. |
| `OPENCLAW_AGENT_ID` | No | `main` | Sent as `x-openclaw-agent-id`. |
| `OPENCLAW_MODEL` | No | `openclaw/default` | Model name sent to OpenClaw. |
| `LOG_LEVEL` | No | `info` | One of `debug`, `info`, `warn`, `error`. |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Proxy API rate limit window. |
| `RATE_LIMIT_MAX` | No | `120` | General API requests per window. |
| `AI_RATE_LIMIT_MAX` | No | `30` | AI API requests per window. |
| `PORT` | No | `3000` | Used by the standalone Next.js server. |
| `HOSTNAME` | No | Platform default | Use `0.0.0.0` in containers. |

## Environment Sets

Development:

- Use `.env.local`.
- Run PostgreSQL locally or with `docker compose up postgres`.
- Optional integration keys can be blank.

Preview:

- Use a separate `DATABASE_URL` from production when testing migrations.
- Keep `NEXTAUTH_SECRET` stable across preview redeploys.
- Add Gemini, Slack, and OpenClaw keys only when previews need live integrations.

Production:

- Require `DATABASE_URL`, `NEXTAUTH_SECRET`, and a canonical app URL.
- Use pooled PostgreSQL connections for serverless deployments.
- Rotate AI, Slack, and OpenClaw credentials through the hosting platform.

## Security Notes

- Do not commit `.env`, `.env.local`, or provider secrets.
- `.env.example` must contain placeholders only.
- Treat Slack webhook URLs and AI provider keys as secrets.
- Restrict database credentials to the minimum privileges needed for the app and migrations.
