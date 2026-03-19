import { fail } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { z } from "zod";
import { setAuthCookies } from "$lib/auth/cookies";
import { errorToActionFail, flattenZodErrors } from "$lib/utils/actionErrors";

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().optional()
  })
  .strict();

export const actions: Actions = {
  default: async ({ request, locals, cookies }) => {
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
      return {
        success: true
      };
    } catch (error) {
      return fail(400, errorToActionFail(error));
    }
  }
};
