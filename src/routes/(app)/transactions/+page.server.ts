import type { Actions, PageServerLoad } from "./$types";
import { z } from "zod";
import { errorToActionFail } from "$lib/utils/actionErrors";
import {
  actionFailure,
  actionSuccess,
  actionValidationFail,
  missingIdFailure
} from "$lib/utils/actionResponses";

const transactionSchema = z.object({
  accountId: z.coerce.number({ invalid_type_error: "Account is required." }),
  categoryId: z.coerce.number({ invalid_type_error: "Category is required." }),
  amount: z.coerce.number().positive("Amount must be positive."),
  type: z.enum(["income", "expense"]),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required.")
});

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const [transactions, accounts, categories] = await Promise.all([
      locals.api.transactionsList(),
      locals.api.accountsList(),
      locals.api.categoriesList()
    ]);
    return {
      transactions,
      accounts,
      categories,
      loadError: null
    };
  } catch (error) {
    return {
      transactions: [],
      accounts: [],
      categories: [],
      loadError: error instanceof Error ? error.message : "Failed to load transactions."
    };
  }
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const parsed = transactionSchema.safeParse({
      accountId: formData.get("accountId"),
      categoryId: formData.get("categoryId"),
      amount: formData.get("amount"),
      type: formData.get("type"),
      description: String(formData.get("description") ?? "") || undefined,
      date: formData.get("occurredAt") ?? formData.get("date")
    });

    if (!parsed.success) {
      return actionValidationFail(parsed.error.format());
    }

    try {
      await locals.api.transactionCreate(parsed.data);
      return actionSuccess("Transaction created.");
    } catch (error) {
      return actionFailure(errorToActionFail(error));
    }
  },
  update: async ({ request, locals }) => {
    const formData = await request.formData();
    const transactionId = String(formData.get("transactionId") || "");
    if (!transactionId) return missingIdFailure("Missing transaction id.");

    const parsed = transactionSchema.safeParse({
      accountId: formData.get("accountId"),
      categoryId: formData.get("categoryId"),
      amount: formData.get("amount"),
      type: formData.get("type"),
      description: String(formData.get("description") ?? "") || undefined,
      date: formData.get("occurredAt") ?? formData.get("date")
    });

    if (!parsed.success) {
      return actionValidationFail(parsed.error.format());
    }

    try {
      await locals.api.transactionUpdate(transactionId, parsed.data);
      return actionSuccess("Transaction updated.");
    } catch (error) {
      return actionFailure(errorToActionFail(error));
    }
  },
  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const transactionId = String(formData.get("transactionId") || "");
    if (!transactionId) return missingIdFailure("Missing transaction id.");

    try {
      await locals.api.transactionDelete(transactionId);
      return actionSuccess("Transaction deleted.");
    } catch (error) {
      return actionFailure(errorToActionFail(error));
    }
  }
};
