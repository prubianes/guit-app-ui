import { clearAuthCookies } from "$lib/auth/cookies";
import { isAuthFailure } from "$lib/api/errors";
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  try {
    const user = await locals.api.authMe();
    locals.session.user = user;
    return { user };
  } catch (error) {
    if (isAuthFailure(error)) {
      clearAuthCookies(cookies);
      throw redirect(303, "/login");
    }

    throw error;
  }
};
