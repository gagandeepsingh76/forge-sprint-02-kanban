import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();
const proxyEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  AI_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
});
const proxyEnv = proxyEnvSchema.parse(process.env);

function getClientKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();

  return ip || request.headers.get("x-real-ip") || "anonymous";
}

function pruneBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function applySecurityHeaders(response: NextResponse) {
  const isDev = proxyEnv.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    "connect-src 'self' https://generativelanguage.googleapis.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

function checkRateLimit(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith("/api/")) {
    return null;
  }

  const now = Date.now();
  const max = pathname.startsWith("/api/ai/")
    ? proxyEnv.AI_RATE_LIMIT_MAX
    : proxyEnv.RATE_LIMIT_MAX;
  const key = `${getClientKey(request)}:${pathname}`;
  const currentBucket = buckets.get(key);

  pruneBuckets(now);

  if (!currentBucket || currentBucket.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + proxyEnv.RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  currentBucket.count += 1;

  if (currentBucket.count <= max) {
    return null;
  }

  const retryAfterSeconds = Math.ceil((currentBucket.resetAt - now) / 1000);
  const response = NextResponse.json(
    {
      error: "Rate limit exceeded.",
      code: "RATE_LIMITED",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(max),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(currentBucket.resetAt),
      },
    },
  );

  return response;
}

export function proxy(request: NextRequest) {
  const limitedResponse = checkRateLimit(request);

  if (limitedResponse) {
    return applySecurityHeaders(limitedResponse);
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/|favicon.ico|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
