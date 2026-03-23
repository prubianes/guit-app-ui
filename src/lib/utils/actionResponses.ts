import { fail } from "@sveltejs/kit";
import type { ActionFail } from "$lib/utils/actionErrors";
import { flattenZodErrors } from "$lib/utils/actionErrors";

export type ActionSuccess = {
  success: true;
  message: string;
};

export const actionSuccess = (message: string): ActionSuccess => ({
  success: true,
  message
});

export const actionValidationFail = (error: Record<string, unknown>) =>
  fail(400, {
    success: false,
    message: "Please review the form values and try again.",
    code: "VALIDATION_ERROR",
    fieldErrors: flattenZodErrors(error)
  });

export const actionFailure = (error: ActionFail) =>
  fail(400, {
    success: false,
    ...error
  });

export const missingIdFailure = (message: string) =>
  fail(400, {
    success: false,
    code: "VALIDATION_ERROR",
    message
  });
