# API

All API routes return JSON. Error responses use:

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": {},
  "requestId": "uuid"
}
```

Authenticated routes require a valid NextAuth session cookie.

## Auth

### `POST /api/auth/register`

Creates a credentials user.

Request:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "pass1234"
}
```

Rules:

- `name` must be at least 2 characters.
- `email` must be valid and is normalized to lowercase.
- `password` must be at least 8 characters and include a letter and number.

Success `201`:

```json
{
  "user": {
    "id": "user_id",
    "name": "Ada Lovelace",
    "email": "ada@example.com"
  }
}
```

Common errors: `400 VALIDATION_ERROR`, `409 ACCOUNT_EXISTS`, `500 ACCOUNT_CREATE_FAILED`.

### `/api/auth/[...nextauth]`

NextAuth handles credentials login, logout, callback, and session endpoints. The app uses JWT sessions and a custom `/login` sign-in page.

## Gemini AI

All Gemini routes require authentication and `GEMINI_API_KEY`.

### `POST /api/ai/generate-tasks`

Generates Kanban tasks from a project description.

Request:

```json
{
  "projectDescription": "Build a production Kanban release with AI task generation.",
  "boardTitle": "Launch",
  "count": 6
}
```

Rules: `projectDescription` minimum 20 characters, `count` from 1 to 12.

Success `200`:

```json
{
  "tasks": [
    {
      "title": "Write API tests",
      "description": "Cover happy and unhappy API paths.",
      "priority": "high",
      "dueDate": "2026-07-01",
      "assignee": "Ada",
      "subtasks": ["Create route tests"]
    }
  ]
}
```

### `POST /api/ai/breakdown-task`

Breaks one task into subtasks.

Request:

```json
{
  "taskTitle": "Add testing suite",
  "taskDescription": "Cover app behavior.",
  "desiredSubtasks": 5
}
```

Rules: `desiredSubtasks` from 2 to 10.

Success `200`:

```json
{
  "subtasks": [
    {
      "title": "Create route tests",
      "description": "Exercise route validation and responses.",
      "priority": "medium",
      "dueDate": "2026-07-03"
    }
  ]
}
```

### `POST /api/ai/prioritize`

Assigns priorities and rationale to a task list.

Request:

```json
{
  "projectGoal": "Ship production hardening",
  "tasks": [
    {
      "title": "Secure API routes",
      "description": "Require sessions and validation.",
      "priority": "high"
    }
  ]
}
```

Rules: `tasks` must contain 1 to 20 items.

Success `200`:

```json
{
  "tasks": [
    {
      "title": "Secure API routes",
      "priority": "urgent",
      "rationale": "Protects production traffic.",
      "suggestedDueDate": "2026-07-02"
    }
  ]
}
```

Gemini route errors: `401 UNAUTHORIZED`, `400 VALIDATION_ERROR`, `503 GEMINI_NOT_CONFIGURED`, `502 GEMINI_REQUEST_FAILED`.

## OpenClaw

### `POST /api/openclaw/assistant`

Calls the configured assistant provider. Requires authentication. OpenClaw is used when `OPENCLAW_GATEWAY_URL` plus `OPENCLAW_GATEWAY_TOKEN` or `OPENCLAW_GATEWAY_PASSWORD` are configured; otherwise the route falls back to OpenRouter when `OPENROUTER_API_KEY` is configured.

Request:

```json
{
  "mode": "create-tasks",
  "prompt": "Plan onboarding, AI tasks, and backlog grooming.",
  "boardTitle": "Launch"
}
```

Modes: `create-tasks`, `sprint-plan`, `backlog`, `user-stories`.

Success `200`:

```json
{
  "summary": "Recommended sprint plan.",
  "tasks": [],
  "sprintPlan": ["Start with auth hardening"],
  "backlog": [],
  "userStories": []
}
```

Common errors: `401 UNAUTHORIZED`, `400 VALIDATION_ERROR`, `503 OPENCLAW_NOT_CONFIGURED` when neither OpenClaw nor OpenRouter is configured, `502 OPENCLAW_REQUEST_FAILED`.

## Slack

### `POST /api/slack/webhook`

Sends a formatted Slack incoming webhook message. Requires authentication. If `SLACK_WEBHOOK_URL` is not configured, the route returns `202` with a skipped result.

Request:

```json
{
  "event": "task.created",
  "boardTitle": "Launch",
  "taskTitle": "Ship tests",
  "assignee": "Ada",
  "priority": "high",
  "message": "Ready for review"
}
```

Events: `task.created`, `task.completed`, `task.assigned`, `board.created`.

Success `200`:

```json
{
  "delivered": true,
  "skipped": false
}
```

Skipped `202`:

```json
{
  "delivered": false,
  "skipped": true
}
```

Common errors: `401 UNAUTHORIZED`, `400 VALIDATION_ERROR`, `502 SLACK_DELIVERY_FAILED`.

## Rate Limits

The proxy applies rate limits to `/api/*` routes. Defaults:

- General API routes: 120 requests per 60 seconds per client and path.
- AI routes: 30 requests per 60 seconds per client and path.

Limit responses use `429` with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.
