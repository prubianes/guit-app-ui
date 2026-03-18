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
    if (error instanceof ApiClientError && error.code === "UNAUTHORIZED") {
      clearAuthCookies(cookies);
      throw redirect(303, "/login");
    }

    throw error;
  }
};
