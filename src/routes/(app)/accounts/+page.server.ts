import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { z } from "zod";
import { errorToActionFail, flattenZodErrors } from "$lib/utils/actionErrors";

const accountSchema = z.object({
  name: z.string().min(1, "Account name is required."),
  type: z.string().min(1, "Account type is required."),
  currency: z.string().length(3, "Use a 3-letter currency code."),
  balance: z.coerce.number(),
  institution: z.string().optional()
});

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const accounts = await locals.api.accountsList();
    return { accounts, loadError: null };
  } catch (error) {
    return {
      accounts: [],
      loadError: error instanceof Error ? error.message : "Failed to load accounts."
    };
  }
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const parsed = accountSchema.safeParse({
      name: formData.get("name"),
      type: formData.get("type"),
      currency: String(formData.get("currency") ?? "").toUpperCase(),
      balance: formData.get("balance"),
      institution: String(formData.get("institution") ?? "")
    });

    if (!parsed.success) {
      return fail(400, {
        ...errorToActionFail(new Error("VALIDATION_ERROR")),
        fieldErrors: flattenZodErrors(parsed.error.format())
      });
    }

    try {
      await locals.api.accountCreate(parsed.data);
      return { success: true, message: "Account created." };
    } catch (error) {
      return fail(400, errorToActionFail(error));
    }
  },
  update: async ({ request, locals }) => {
    const formData = await request.formData();
    const accountId = String(formData.get("accountId") || "");

    const parsed = accountSchema.safeParse({
      name: formData.get("name"),
      type: formData.get("type"),
      currency: String(formData.get("currency") ?? "").toUpperCase(),
      balance: formData.get("balance"),
      institution: String(formData.get("institution") ?? "")
    });

    if (!accountId) {
      return fail(400, { message: "Missing account id." });
    }

    if (!parsed.success) {
      return fail(400, {
        ...errorToActionFail(new Error("VALIDATION_ERROR")),
        fieldErrors: flattenZodErrors(parsed.error.format())
      });
    }

    try {
      await locals.api.accountUpdate(accountId, parsed.data);
      return { success: true, message: "Account updated." };
    } catch (error) {
      return fail(400, errorToActionFail(error));
    }
  },
  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const accountId = String(formData.get("accountId") || "");
    if (!accountId) {
      return fail(400, { message: "Missing account id." });
    }

    try {
      await locals.api.accountDelete(accountId);
      return { success: true, message: "Account deleted." };
    } catch (error) {
      return fail(400, errorToActionFail(error));
    }
  }
};
