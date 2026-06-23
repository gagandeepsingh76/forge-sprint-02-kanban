import { z } from "zod";
import { apiError, apiValidationError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    status: number,
    message: string,
    code = "HTTP_ERROR",
    details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RouteContext {
  requestId: string;
}

type RouteHandler = (
  request: Request,
  context: RouteContext,
) => Promise<Response> | Response;

function createRequestId() {
  return crypto.randomUUID();
}

function formatZodIssues(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

function setRequestId(response: Response, requestId: string) {
  response.headers.set("x-request-id", requestId);
  return response;
}

export async function parseJsonBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
  message: string,
): Promise<z.infer<TSchema>> {
  const body: unknown = await request.json().catch(() => {
    throw new HttpError(400, "Request body must be valid JSON.", "INVALID_JSON");
  });
  const parsedBody = schema.safeParse(body);

  if (!parsedBody.success) {
    throw new HttpError(
      400,
      message,
      "VALIDATION_ERROR",
      formatZodIssues(parsedBody.error),
    );
  }

  return parsedBody.data;
}

export function withRouteHandler(name: string, handler: RouteHandler) {
  return async function routeHandler(request: Request) {
    const requestId = createRequestId();
    const startedAt = performance.now();
    const url = new URL(request.url);

    logger.info("api.request", {
      requestId,
      route: name,
      method: request.method,
      path: url.pathname,
    });

    try {
      const response = await handler(request, { requestId });

      logger.info("api.response", {
        requestId,
        route: name,
        status: response.status,
        durationMs: Math.round(performance.now() - startedAt),
      });

      return setRequestId(response, requestId);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const code =
        error instanceof HttpError ? error.code : "INTERNAL_SERVER_ERROR";
      const message =
        error instanceof HttpError
          ? error.message
          : "Something went wrong while processing the request.";
      const details = error instanceof HttpError ? error.details : undefined;

      logger.error("api.error", {
        requestId,
        route: name,
        status,
        code,
        durationMs: Math.round(performance.now() - startedAt),
        error,
      });

      const response =
        code === "VALIDATION_ERROR"
          ? apiValidationError(message, details, requestId)
          : apiError(message, status, {
              code,
              details,
              requestId,
            });

      return setRequestId(response, requestId);
    }
  };
}
