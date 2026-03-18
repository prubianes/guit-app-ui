import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { z } from "zod";
import { errorToActionFail, flattenZodErrors } from "$lib/utils/actionErrors";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required."),
  color: z.string().optional(),
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
      color: formData.get("color"),
      kind: formData.get("kind")
    });

    if (!parsed.success) {
      return fail(400, {
        ...errorToActionFail(new Error("VALIDATION_ERROR")),
        fieldErrors: flattenZodErrors(parsed.error.format())
      });
    }

    try {
      await locals.api.categoryCreate(parsed.data);
      return { success: true, message: "Category created." };
    } catch (error) {
      return fail(400, errorToActionFail(error));
    }
  },
  update: async ({ request, locals }) => {
    const formData = await request.formData();
    const categoryId = String(formData.get("categoryId") || "");

    const parsed = categorySchema.safeParse({
      name: formData.get("name"),
      color: formData.get("color"),
      kind: formData.get("kind")
    });

    if (!categoryId) {
      return fail(400, { message: "Missing category id." });
    }

    if (!parsed.success) {
      return fail(400, {
        ...errorToActionFail(new Error("VALIDATION_ERROR")),
        fieldErrors: flattenZodErrors(parsed.error.format())
      });
    }

    try {
      await locals.api.categoryUpdate(categoryId, parsed.data);
      return { success: true, message: "Category updated." };
    } catch (error) {
      return fail(400, errorToActionFail(error));
    }
  },
  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const categoryId = String(formData.get("categoryId") || "");
    if (!categoryId) return fail(400, { message: "Missing category id." });

    try {
      await locals.api.categoryDelete(categoryId);
      return { success: true, message: "Category deleted." };
    } catch (error) {
      return fail(400, errorToActionFail(error));
    }
  }
};
