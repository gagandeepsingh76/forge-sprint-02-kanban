import "server-only";

import { parseEnv, parseProductionEnv } from "@/lib/env-schema";

const parsedEnv = parseEnv(process.env);

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
};

export type AppEnv = typeof env;

export function validateProductionEnv() {
  return parseProductionEnv(process.env);
}
