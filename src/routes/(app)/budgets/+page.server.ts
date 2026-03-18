import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { z } from "zod";
import { errorToActionFail, flattenZodErrors } from "$lib/utils/actionErrors";

const budgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required."),
  amount: z.coerce.number().positive("Budget amount must be positive."),
  period: z.enum(["weekly", "monthly", "yearly"]),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const [budgets, categories] = await Promise.all([
      locals.api.budgetsList(),
      locals.api.categoriesList()
    ]);

    return {
      budgets,
      categories,
      loadError: null
    };
  } catch (error) {
    return {
      budgets: [],
      categories: [],
      loadError: error instanceof Error ? error.message : "Failed to load budgets."
    };
  }
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const parsed = budgetSchema.safeParse({
      categoryId: formData.get("categoryId"),
      amount: formData.get("amount"),
      period: formData.get("period"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate")
    });

    if (!parsed.success) {
      return fail(400, {
        ...errorToActionFail(new Error("VALIDATION_ERROR")),
        fieldErrors: flattenZodErrors(parsed.error.format())
      });
    }

    try {
      await locals.api.budgetCreate(parsed.data);
      return { success: true, message: "Budget created." };
    } catch (error) {
      return fail(400, errorToActionFail(error));
    }
  },
  update: async ({ request, locals }) => {
    const formData = await request.formData();
    const budgetId = String(formData.get("budgetId") || "");
    if (!budgetId) return fail(400, { message: "Missing budget id." });

    const parsed = budgetSchema.safeParse({
      categoryId: formData.get("categoryId"),
      amount: formData.get("amount"),
      period: formData.get("period"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate")
    });

    if (!parsed.success) {
      return fail(400, {
        ...errorToActionFail(new Error("VALIDATION_ERROR")),
        fieldErrors: flattenZodErrors(parsed.error.format())
      });
    }

    try {
      await locals.api.budgetUpdate(budgetId, parsed.data);
      return { success: true, message: "Budget updated." };
    } catch (error) {
      return fail(400, errorToActionFail(error));
    }
  },
  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const budgetId = String(formData.get("budgetId") || "");
    if (!budgetId) return fail(400, { message: "Missing budget id." });

    try {
      await locals.api.budgetDelete(budgetId);
      return { success: true, message: "Budget deleted." };
    } catch (error) {
      return fail(400, errorToActionFail(error));
    }
  }
};
