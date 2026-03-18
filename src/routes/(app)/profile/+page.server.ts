import { clearAuthCookies } from "$lib/auth/cookies";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { errorToActionFail } from "$lib/utils/actionErrors";

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
  logout: async ({ cookies }) => {
    clearAuthCookies(cookies);
    throw redirect(303, "/login");
  },
  refreshProfile: async ({ locals }) => {
    try {
      await locals.api.authMe();
      return { success: true, message: "Profile refreshed." };
    } catch (error) {
      return fail(400, errorToActionFail(error));
    }
  }
};
