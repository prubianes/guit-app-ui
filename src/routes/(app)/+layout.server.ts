import { clearAuthCookies } from "$lib/auth/cookies";
import { ApiClientError } from "$lib/api/errors";
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  try {
    const user = await locals.api.authMe();
    locals.session.user = user;
    return { user };
  } catch (error) {
    const isAuthError =
      error instanceof ApiClientError &&
      (error.code === "UNAUTHORIZED" || error.code === "INVALID_TOKEN" || error.status === 401);

    if (isAuthError) {
      clearAuthCookies(cookies);
      throw redirect(303, "/login");
    }

    throw error;
  }
};
