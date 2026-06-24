import { describe, expect, it } from "vitest";
import {
  cleanEnvValue,
  parseEnv,
  parseProductionEnv,
} from "@/lib/env-schema";

describe("environment schema", () => {
  it("trims whitespace and accidental quotes before validating LOG_LEVEL", () => {
    const parsedEnv = parseEnv({
      LOG_LEVEL: ` "info" `,
    });

    expect(parsedEnv.success).toBe(true);

    if (parsedEnv.success) {
      expect(parsedEnv.data.LOG_LEVEL).toBe("info");
    }
  });

  it("rejects unsupported LOG_LEVEL values", () => {
    const parsedEnv = parseEnv({
      LOG_LEVEL: "verbose",
    });

    expect(parsedEnv.success).toBe(false);

    if (!parsedEnv.success) {
      expect(parsedEnv.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["LOG_LEVEL"],
          }),
        ]),
      );
    }
  });

  it("keeps optional integrations unset when values are blank or quoted blank", () => {
    const parsedEnv = parseEnv({
      GEMINI_API_KEY: "",
      SLACK_WEBHOOK_URL: "''",
      OPENCLAW_GATEWAY_URL: ` "" `,
      OPENROUTER_API_KEY: "''",
      LOG_LEVEL: "warn",
    });

    expect(parsedEnv.success).toBe(true);

    if (parsedEnv.success) {
      expect(parsedEnv.data.GEMINI_API_KEY).toBeUndefined();
      expect(parsedEnv.data.SLACK_WEBHOOK_URL).toBeUndefined();
      expect(parsedEnv.data.OPENCLAW_GATEWAY_URL).toBeUndefined();
      expect(parsedEnv.data.OPENROUTER_API_KEY).toBeUndefined();
      expect(parsedEnv.data.LOG_LEVEL).toBe("warn");
    }
  });

  it("reports production-only required variables clearly", () => {
    const parsedEnv = parseProductionEnv({
      NODE_ENV: "production",
      LOG_LEVEL: "error",
    });

    expect(parsedEnv.success).toBe(false);

    if (!parsedEnv.success) {
      expect(parsedEnv.error.issues.map((issue) => issue.path.join("."))).toEqual(
        expect.arrayContaining([
          "DATABASE_URL",
          "NEXTAUTH_SECRET",
          "NEXTAUTH_URL",
        ]),
      );
    }
  });

  it("normalizes quoted empty values to undefined", () => {
    expect(cleanEnvValue(` " " `)).toBeUndefined();
    expect(cleanEnvValue(" 'debug' ")).toBe("debug");
  });
});
