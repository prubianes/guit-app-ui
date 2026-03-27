type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;
const RELEASE =
  process.env.PUBLIC_APP_RELEASE ||
  process.env.APP_RELEASE ||
  process.env.GITHUB_SHA?.slice(0, 12) ||
  "dev";

const REDACT_KEYS = new Set([
  "password",
  "token",
  "accesstoken",
  "access_token",
  "refreshtoken",
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
    if (REDACT_KEYS.has(key.toLowerCase())) {
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
    release: RELEASE,
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

export const logFunnelEvent = (
  name: string,
  payload: {
    requestId?: string;
    route?: string;
    pathname?: string;
    userId?: string;
    email?: string;
    code?: string;
    resourceId?: string;
  } = {}
) => {
  log("info", "product.funnel", { name, ...payload });
};
