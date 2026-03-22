import { ApiClientError, userMessageForCode } from "$lib/api/errors";

export type ActionFail = {
  success?: false;
  message: string;
  code?: string;
  fieldErrors?: Record<string, string>;
};

export const flattenZodErrors = (errors: Record<string, unknown>) => {
  const fieldErrors: Record<string, string> = {};
  for (const [field, value] of Object.entries(errors)) {
    if (field === "_errors") continue;
    const maybeField = value as { _errors?: string[] };
    const firstError = maybeField._errors?.[0];
    if (firstError) fieldErrors[field] = firstError;
  }
  return fieldErrors;
};

export const errorToActionFail = (error: unknown): ActionFail => {
  if (error instanceof ApiClientError) {
    console.error(
      "API error:",
      JSON.stringify(
        {
          code: error.code,
          message: error.message,
          status: error.status,
          details: error.details
        },
        null,
        2
      )
    );

    const fieldErrors = extractFieldErrorsFromDetails(error.details);
    return {
      success: false,
      message: userMessageForCode(error.code) || error.message,
      code: error.code,
      fieldErrors
    };
  }

  console.error("Unexpected action error:", error);

  return {
    success: false,
    message: "Unexpected server error. Please try again."
  };
};

const extractFieldErrorsFromDetails = (details: unknown) => {
  if (!Array.isArray(details)) return undefined;

  const fieldErrors: Record<string, string> = {};
  for (const item of details) {
    if (!item || typeof item !== "object") continue;

    const candidate = item as { path?: unknown; message?: unknown };
    const path = Array.isArray(candidate.path) ? candidate.path : [];
    const field = typeof path[0] === "string" ? path[0] : undefined;
    const message = typeof candidate.message === "string" ? candidate.message : undefined;

    if (field && message && !fieldErrors[field]) {
      fieldErrors[field] = message;
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
};
