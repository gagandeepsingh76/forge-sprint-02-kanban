type LogLevel = "debug" | "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

const levelWeights: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel = process.env.LOG_LEVEL as LogLevel | undefined;
const minimumLevel =
  configuredLevel && configuredLevel in levelWeights ? configuredLevel : "info";

function serializeError(error: unknown): unknown {
  if (error instanceof Error) {
    const cause = "cause" in error ? error.cause : undefined;

    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      cause: cause ? serializeError(cause) : undefined,
    };
  }

  return error;
}

function writeLog(level: LogLevel, message: string, meta: LogMeta = {}) {
  if (levelWeights[level] < levelWeights[minimumLevel]) {
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
    error: meta.error ? serializeError(meta.error) : undefined,
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  debug: (message: string, meta?: LogMeta) => writeLog("debug", message, meta),
  info: (message: string, meta?: LogMeta) => writeLog("info", message, meta),
  warn: (message: string, meta?: LogMeta) => writeLog("warn", message, meta),
  error: (message: string, meta?: LogMeta) => writeLog("error", message, meta),
};
