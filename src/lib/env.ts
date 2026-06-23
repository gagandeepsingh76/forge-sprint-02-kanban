import "server-only";

import { z } from "zod";

const DEFAULT_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/forge_sprint_kanban";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.url().optional(),
);

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: optionalUrl,
  NEXTAUTH_SECRET: optionalString,
  NEXTAUTH_URL: optionalUrl,
  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: z.string().min(1).default("gemini-3.5-flash"),
  SLACK_WEBHOOK_URL: optionalUrl,
  OPENCLAW_GATEWAY_URL: optionalUrl,
  OPENCLAW_GATEWAY_TOKEN: optionalString,
  OPENCLAW_GATEWAY_PASSWORD: optionalString,
  OPENCLAW_AGENT_ID: z.string().min(1).default("main"),
  OPENCLAW_MODEL: z.string().min(1).default("openclaw/default"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const productionEnvSchema = envSchema.extend({
  DATABASE_URL: z.url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.url(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      message: "environment.validation_failed",
      issues: parsedEnv.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    }),
  );

  throw new Error("Invalid environment configuration.");
}

export const env = {
  ...parsedEnv.data,
  DATABASE_URL: parsedEnv.data.DATABASE_URL ?? DEFAULT_DATABASE_URL,
};

export type AppEnv = typeof env;

export function validateProductionEnv() {
  return productionEnvSchema.safeParse(process.env);
}
