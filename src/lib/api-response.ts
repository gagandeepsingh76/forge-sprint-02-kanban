export interface ApiErrorOptions {
  code?: string;
  details?: unknown;
  requestId?: string;
}

export interface ApiErrorPayload {
  error: string;
  code?: string;
  details?: unknown;
  requestId?: string;
}

export function apiOk<T>(data: T, init?: ResponseInit) {
  return Response.json(data, init);
}

export function apiCreated<T>(data: T) {
  return apiOk(data, { status: 201 });
}

export function apiAccepted<T>(data: T) {
  return apiOk(data, { status: 202 });
}

export function apiError(
  message: string,
  status = 500,
  options: ApiErrorOptions = {},
) {
  const payload: ApiErrorPayload = {
    error: message,
    code: options.code,
    details: options.details,
    requestId: options.requestId,
  };

  return Response.json(payload, { status });
}

export function apiUnauthorized(requestId?: string) {
  return apiError("Unauthorized", 401, {
    code: "UNAUTHORIZED",
    requestId,
  });
}

export function apiValidationError(
  message: string,
  details?: unknown,
  requestId?: string,
) {
  return apiError(message, 400, {
    code: "VALIDATION_ERROR",
    details,
    requestId,
  });
}
