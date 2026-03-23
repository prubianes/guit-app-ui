import type { Actions, PageServerLoad } from "./$types";
import { z } from "zod";
import { errorToActionFail } from "$lib/utils/actionErrors";
import {
  actionFailure,
  actionSuccess,
  actionValidationFail,
  missingIdFailure
} from "$lib/utils/actionResponses";

const accountTypeOptions = [
  "checking",
  "savings",
  "cash",
  "credit_card",
  "investment",
  "loan",
  "other"
] as const;

const parseOptionalString = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const accountSchema = z.object({
  name: z.string().min(1, "Account name is required."),
  type: z.enum(accountTypeOptions, {
    errorMap: () => ({ message: "Please select a valid account type." })
  }),
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
      institution: parseOptionalString(formData.get("institution"))
    });

    if (!parsed.success) {
      return actionValidationFail(parsed.error.format());
    }

    try {
      await locals.api.accountCreate(parsed.data);
      return actionSuccess("Account created.");
    } catch (error) {
      return actionFailure(errorToActionFail(error));
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
      institution: parseOptionalString(formData.get("institution"))
    });

    if (!accountId) {
      return missingIdFailure("Missing account id.");
    }

    if (!parsed.success) {
      return actionValidationFail(parsed.error.format());
    }

    try {
      await locals.api.accountUpdate(accountId, parsed.data);
      return actionSuccess("Account updated.");
    } catch (error) {
      return actionFailure(errorToActionFail(error));
    }
  },
  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const accountId = String(formData.get("accountId") || "");
    if (!accountId) {
      return missingIdFailure("Missing account id.");
    }

    try {
      await locals.api.accountDelete(accountId);
      return actionSuccess("Account deleted.");
    } catch (error) {
      return actionFailure(errorToActionFail(error));
    }
  }
};
