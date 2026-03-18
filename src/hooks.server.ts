import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { createApiClient } from "$lib/api/client";
import { getTokensFromCookies } from "$lib/auth/cookies";
import { isAuthenticated } from "$lib/auth/session";

export const handle: Handle = async ({ event, resolve }) => {
  const { accessToken, refreshToken } = getTokensFromCookies(event.cookies);

  event.locals.session = {
    accessToken,
    refreshToken,
    user: null
  };
  event.locals.api = createApiClient(event);

  const isProtectedRoute = event.route.id?.startsWith("/(app)");
  if (isProtectedRoute && !isAuthenticated(event.locals.session)) {
    throw redirect(303, "/login");
  }

  return resolve(event);
};
