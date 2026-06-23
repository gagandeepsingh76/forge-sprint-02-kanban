# Forge Sprint 02 Kanban

Forge Sprint 02 Kanban is a production-ready sprint board built with Next.js App Router, credentials auth, Prisma/PostgreSQL, Gemini task generation, Slack notifications, and an OpenClaw assistant panel.

## Features

- Authenticated dashboard with login and signup.
- Multi-board Kanban workspace with add, edit, delete, move, and drag-reorder task flows.
- Local board persistence through browser `localStorage`.
- PostgreSQL schema and Prisma client for users, sessions, boards, columns, and tasks.
- Gemini-powered task generation, task breakdown, and prioritization API routes.
- OpenClaw assistant route for task creation, sprint plans, backlogs, and user stories.
- Slack webhook notifications for board and task events.
- Security headers, API rate limiting, structured route errors, lint/build/test CI, Docker, and Vercel deployment config.

## Stack

- Next.js 16.2.9, React 19, TypeScript, Tailwind CSS 4.
- NextAuth v4 credentials provider.
- Prisma 7 with PostgreSQL and `@prisma/adapter-pg`.
- Vitest, React Testing Library, ESLint 9.
- Docker standalone output and GitHub Actions workflows.

## Quick Start

```bash
npm install
Copy-Item .env.example .env.local
npx prisma migrate dev
npm run dev
```

Open `http://localhost:3000`. Create an account, then sign in to reach `/dashboard`.

On macOS or Linux, use `cp .env.example .env.local` instead of `Copy-Item`.

## Scripts

- `npm run dev` - start the development server.
- `npm run lint` - run ESLint.
- `npm run build` - generate Prisma Client and build Next.js standalone output.
- `npm start` - run the standalone production server after `npm run build`.
- `npm test` - generate Prisma Client and run Vitest once.
- `npm run test:watch` - run Vitest in watch mode.

## Documentation

- [Architecture](Architecture.md)
- [API](API.md)
- [Deployment](DEPLOYMENT.md)
- [Environment](ENVIRONMENT.md)

## Production Notes

The database schema includes board/task tables, but the current dashboard stores board state in browser `localStorage`. Auth data uses PostgreSQL through Prisma. Treat server-side board persistence as the next major backend milestone.
