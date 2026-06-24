import { z } from "zod";

const DEFAULT_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/forge_sprint_kanban";

export const logLevelSchema = z.enum(["debug", "info", "warn", "error"]);

export function cleanEnvValue(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  let cleanedValue = value.trim();
  const quote = cleanedValue[0];
  const hasMatchingQuotes =
    (quote === `"` || quote === `'`) && cleanedValue.endsWith(quote);

  if (hasMatchingQuotes) {
    cleanedValue = cleanedValue.slice(1, -1).trim();
  }

  return cleanedValue === "" ? undefined : cleanedValue;
}

export function normalizeEnvRecord(
  source: NodeJS.ProcessEnv | Record<string, unknown>,
) {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, cleanEnvValue(value)]),
  );
}

const optionalString = z.string().min(1).optional();
const optionalUrl = z.url().optional();

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: optionalUrl,
  NEXTAUTH_SECRET: optionalString,
  NEXTAUTH_URL: optionalUrl,
  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: z.string().min(1).default("gemini-3.5-flash"),
  OPENROUTER_API_KEY: optionalString,
  SLACK_WEBHOOK_URL: optionalUrl,
  OPENCLAW_GATEWAY_URL: optionalUrl,
  OPENCLAW_GATEWAY_TOKEN: optionalString,
  OPENCLAW_GATEWAY_PASSWORD: optionalString,
  OPENCLAW_AGENT_ID: z.string().min(1).default("main"),
  OPENCLAW_MODEL: z.string().min(1).default("openclaw/default"),
  LOG_LEVEL: logLevelSchema.default("info"),
});

export const productionEnvSchema = envSchema.extend({
  DATABASE_URL: z.url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.url(),
});

export function parseEnv(source: NodeJS.ProcessEnv | Record<string, unknown>) {
  const parsedEnv = envSchema.safeParse(normalizeEnvRecord(source));

  if (!parsedEnv.success) {
    return parsedEnv;
  }

  return {
    success: true,
    data: {
      ...parsedEnv.data,
      DATABASE_URL: parsedEnv.data.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    },
  } as const;
}

export function parseProductionEnv(
  source: NodeJS.ProcessEnv | Record<string, unknown>,
) {
  return productionEnvSchema.safeParse(normalizeEnvRecord(source));
}
