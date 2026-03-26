import { fail, isRedirect, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { z } from "zod";
import { setAuthCookies } from "$lib/auth/cookies";
import { errorToActionFail, flattenZodErrors } from "$lib/utils/actionErrors";
import { log, logFunnelEvent } from "$lib/utils/logger";

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().optional()
  })
  .strict();

export const actions: Actions = {
  default: async ({ request, locals, cookies, url }) => {
    const pathname = url?.pathname ?? "/register";
    const formData = await request.formData();
    const parsed = registerSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName")
    });

    if (!parsed.success) {
      return fail(400, {
        ...errorToActionFail(new Error("VALIDATION_ERROR")),
        fieldErrors: flattenZodErrors(parsed.error.format())
      });
    }

    try {
      const name = [parsed.data.firstName, parsed.data.lastName].filter(Boolean).join(" ").trim();

      const auth = await locals.api.authRegister({
        email: parsed.data.email,
        password: parsed.data.password,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        // Backend contract expects `name`; we derive it from first + last.
        name
      });
      setAuthCookies(cookies, {
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken
      });
      log("info", "auth.register_success", {
        requestId: locals.requestId,
        route: "/register",
        pathname,
        email: parsed.data.email
      });
      logFunnelEvent("auth_register_success", {
        requestId: locals.requestId,
        route: "/register",
        pathname,
        email: parsed.data.email
      });
      throw redirect(303, "/");
    } catch (error) {
      if (isRedirect(error)) {
        throw error;
      }
      const actionFail = errorToActionFail(error);
      log("warn", "auth.register_failure", {
        requestId: locals.requestId,
        route: "/register",
        pathname,
        email: parsed.data.email,
        code: actionFail.code
      });
      logFunnelEvent("auth_register_failure", {
        requestId: locals.requestId,
        route: "/register",
        pathname: url.pathname,
        email: parsed.data.email,
        code: actionFail.code
      });
      return fail(400, actionFail);
    }
  }
};
