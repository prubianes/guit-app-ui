import { fail, isRedirect, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { z } from "zod";
import { setAuthCookies } from "$lib/auth/cookies";
import { errorToActionFail, flattenZodErrors } from "$lib/utils/actionErrors";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters.")
});

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.session.accessToken || locals.session.refreshToken) {
    try {
      await locals.api.authMe();
      return {
        alreadyAuthenticated: true
      };
    } catch {
      return {
        alreadyAuthenticated: false
      };
    }
  }

  return {
    alreadyAuthenticated: false
  };
};

export const actions: Actions = {
  default: async ({ request, locals, cookies }) => {
    const formData = await request.formData();
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password")
    });

    if (!parsed.success) {
      return fail(400, {
        ...errorToActionFail(new Error("VALIDATION_ERROR")),
        fieldErrors: flattenZodErrors(parsed.error.format())
      });
    }

    try {
      const auth = await locals.api.authLogin(parsed.data);
      setAuthCookies(cookies, {
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken
      });
      throw redirect(303, "/");
    } catch (error) {
      if (isRedirect(error)) {
        throw error;
      }
      return fail(400, errorToActionFail(error));
    }
  }
};
