type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

const REDACT_KEYS = new Set([
  "password",
  "token",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "authorization",
  "cookie",
  "set-cookie"
]);

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const redact = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(redact);
  if (!isObject(value)) return value;

  const next: Record<string, unknown> = {};
  for (const [key, rawValue] of Object.entries(value)) {
    if (REDACT_KEYS.has(key)) {
      next[key] = "***redacted***";
      continue;
    }
    next[key] = redact(rawValue);
  }
  return next;
};

export const log = (level: LogLevel, event: string, payload: LogPayload = {}) => {
  const safePayload = redact(payload);
  const structured = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(isObject(safePayload) ? safePayload : {})
  };
  const serialized = JSON.stringify(structured);

  if (level === "error") {
    console.error(serialized);
    return;
  }
  if (level === "warn") {
    console.warn(serialized);
    return;
  }
  console.info(serialized);
};

export const logApiError = (payload: {
  requestId?: string;
  route?: string;
  endpoint?: string;
  method?: string;
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}) => {
  log("error", "api.error", payload);
};
