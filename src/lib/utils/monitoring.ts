import { log } from "$lib/utils/logger";

type ServerExceptionContext = {
  requestId?: string;
  route?: string;
  pathname?: string;
  status?: number;
  message?: string;
  details?: unknown;
};

const provider = (process.env.MONITORING_PROVIDER || "console").toLowerCase();

export const captureServerException = (context: ServerExceptionContext) => {
  // Provider-agnostic entrypoint; wire Sentry/Datadog/etc here when enabled.
  if (provider === "none") return;

  log("error", "monitoring.server_exception", {
    provider,
    ...context
  });
};

export const captureClientException = (context: {
  route?: string;
  pathname?: string;
  status?: number;
  message?: string;
  details?: unknown;
}) => {
  if (provider === "none") return;

  log("error", "monitoring.client_exception", {
    provider,
    ...context
  });
};
