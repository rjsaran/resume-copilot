type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Context values must be plain, loggable data — never put an API key,
 * decrypted secret, or full prompt/resume/knowledge-base body in here.
 * Log identifiers and sizes (userId, applicationId, model, duration,
 * character counts), not payloads.
 */
type LogContext = Record<string, string | number | boolean | null | undefined>;

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function minLevel(): LogLevel {
  const fromEnv = process.env.LOG_LEVEL;
  if (fromEnv === "debug" || fromEnv === "info" || fromEnv === "warn" || fromEnv === "error") {
    return fromEnv;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function write(level: LogLevel, message: string, context?: LogContext) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel()]) return;

  const line = JSON.stringify({
    time: new Date().toISOString(),
    level,
    message,
    ...context,
  });

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  /** Returns a logger that merges `context` into every subsequent call, so related log lines (one request, one job) can be correlated without repeating fields. */
  child(context: LogContext): Logger;
}

function createLogger(baseContext: LogContext): Logger {
  return {
    debug: (message, context) => write("debug", message, { ...baseContext, ...context }),
    info: (message, context) => write("info", message, { ...baseContext, ...context }),
    warn: (message, context) => write("warn", message, { ...baseContext, ...context }),
    error: (message, context) => write("error", message, { ...baseContext, ...context }),
    child: (context) => createLogger({ ...baseContext, ...context }),
  };
}

export const logger = createLogger({});

/** Flattens an Error into loggable fields — never log an Error object directly (util.inspect can leak more than intended). */
export function errorContext(error: unknown): LogContext {
  if (error instanceof Error) {
    return { errorName: error.name, errorMessage: error.message };
  }
  return { errorMessage: String(error) };
}
