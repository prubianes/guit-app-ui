import type { Actions, PageServerLoad } from "./$types";
import { z } from "zod";
import { errorToActionFail } from "$lib/utils/actionErrors";
import {
  actionFailure,
  actionSuccess,
  actionValidationFail,
  missingIdFailure
} from "$lib/utils/actionResponses";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required."),
  kind: z.enum(["income", "expense"])
});

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const categories = await locals.api.categoriesList();
    return { categories, loadError: null };
  } catch (error) {
    return {
      categories: [],
      loadError: error instanceof Error ? error.message : "Failed to load categories."
    };
  }
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const parsed = categorySchema.safeParse({
      name: formData.get("name"),
      kind: formData.get("kind")
    });

    if (!parsed.success) {
      return actionValidationFail(parsed.error.format());
    }

    try {
      await locals.api.categoryCreate(parsed.data);
      return actionSuccess("Category created.");
    } catch (error) {
      return actionFailure(errorToActionFail(error));
    }
  },
  update: async ({ request, locals }) => {
    const formData = await request.formData();
    const categoryId = String(formData.get("categoryId") || "");

    const parsed = categorySchema.safeParse({
      name: formData.get("name"),
      kind: formData.get("kind")
    });

    if (!categoryId) {
      return missingIdFailure("Missing category id.");
    }

    if (!parsed.success) {
      return actionValidationFail(parsed.error.format());
    }

    try {
      await locals.api.categoryUpdate(categoryId, parsed.data);
      return actionSuccess("Category updated.");
    } catch (error) {
      return actionFailure(errorToActionFail(error));
    }
  },
  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const categoryId = String(formData.get("categoryId") || "");
    if (!categoryId) return missingIdFailure("Missing category id.");

    try {
      await locals.api.categoryDelete(categoryId);
      return actionSuccess("Category deleted.");
    } catch (error) {
      return actionFailure(errorToActionFail(error));
    }
  }
};
