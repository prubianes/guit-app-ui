import type { HandleClientError } from "@sveltejs/kit";
import { captureClientException } from "$lib/utils/monitoring";

export const handleError: HandleClientError = ({ error, event, status, message }) => {
  captureClientException({
    route: event.route?.id ?? undefined,
    pathname: event.url.pathname,
    status,
    message,
    details: error instanceof Error ? error.message : String(error)
  });
};
