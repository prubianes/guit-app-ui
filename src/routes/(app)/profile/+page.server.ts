import { clearAuthCookies } from "$lib/auth/cookies";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { errorToActionFail } from "$lib/utils/actionErrors";
import { log } from "$lib/utils/logger";

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const user = await locals.api.authMe();
    return {
      user,
      loadError: null
    };
  } catch (error) {
    return {
      user: null,
      loadError: error instanceof Error ? error.message : "Failed to load profile."
    };
  }
};

export const actions: Actions = {
  logout: async ({ cookies, locals, url }) => {
    const pathname = url?.pathname ?? "/profile";
    log("info", "auth.logout", {
      requestId: locals.requestId,
      route: "/(app)/profile",
      pathname
    });
    clearAuthCookies(cookies);
    throw redirect(303, "/login");
  },
  refreshProfile: async ({ locals, url }) => {
    const pathname = url?.pathname ?? "/profile";
    try {
      await locals.api.authMe();
      return { success: true, message: "Profile refreshed." };
    } catch (error) {
      const actionFail = errorToActionFail(error);
      log("warn", "auth.profile_refresh_failure", {
        requestId: locals.requestId,
        route: "/(app)/profile",
        pathname,
        code: actionFail.code
      });
      return fail(400, actionFail);
    }
  }
};
