import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { z } from "zod";
import { errorToActionFail, flattenZodErrors } from "$lib/utils/actionErrors";

const transactionSchema = z.object({
  accountId: z.string().min(1, "Account is required."),
  categoryId: z.string().min(1, "Category is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
  type: z.enum(["income", "expense"]),
  description: z.string().optional(),
  occurredAt: z.string().min(1, "Date is required.")
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
      description: formData.get("description"),
      occurredAt: formData.get("occurredAt")
    });

    if (!parsed.success) {
      return fail(400, {
        ...errorToActionFail(new Error("VALIDATION_ERROR")),
        fieldErrors: flattenZodErrors(parsed.error.format())
      });
    }

    try {
      await locals.api.transactionCreate(parsed.data);
      return { success: true, message: "Transaction created." };
    } catch (error) {
      return fail(400, errorToActionFail(error));
    }
  },
  update: async ({ request, locals }) => {
    const formData = await request.formData();
    const transactionId = String(formData.get("transactionId") || "");
    if (!transactionId) return fail(400, { message: "Missing transaction id." });

    const parsed = transactionSchema.safeParse({
      accountId: formData.get("accountId"),
      categoryId: formData.get("categoryId"),
      amount: formData.get("amount"),
      type: formData.get("type"),
      description: formData.get("description"),
      occurredAt: formData.get("occurredAt")
    });

    if (!parsed.success) {
      return fail(400, {
        ...errorToActionFail(new Error("VALIDATION_ERROR")),
        fieldErrors: flattenZodErrors(parsed.error.format())
      });
    }

    try {
      await locals.api.transactionUpdate(transactionId, parsed.data);
      return { success: true, message: "Transaction updated." };
    } catch (error) {
      return fail(400, errorToActionFail(error));
    }
  },
  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const transactionId = String(formData.get("transactionId") || "");
    if (!transactionId) return fail(400, { message: "Missing transaction id." });

    try {
      await locals.api.transactionDelete(transactionId);
      return { success: true, message: "Transaction deleted." };
    } catch (error) {
      return fail(400, errorToActionFail(error));
    }
  }
};
