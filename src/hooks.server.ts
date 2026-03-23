import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { createApiClient } from "$lib/api/client";
import { getTokensFromCookies } from "$lib/auth/cookies";
import { isAuthenticated } from "$lib/auth/session";
import { log } from "$lib/utils/logger";

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.requestId = crypto.randomUUID();

  const { accessToken, refreshToken } = getTokensFromCookies(event.cookies);

  event.locals.session = {
    accessToken,
    refreshToken,
    user: null
  };
  event.locals.api = createApiClient(event);

  const isProtectedRoute = event.route.id?.startsWith("/(app)");
  if (isProtectedRoute && !isAuthenticated(event.locals.session)) {
    log("info", "auth.redirect.login", {
      requestId: event.locals.requestId,
      route: event.route.id,
      pathname: event.url.pathname
    });
    throw redirect(303, "/login");
  }

  return resolve(event);
};
