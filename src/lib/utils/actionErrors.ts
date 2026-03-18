import { ApiClientError, userMessageForCode } from "$lib/api/errors";

export type ActionFail = {
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
    return {
      message: userMessageForCode(error.code) || error.message,
      code: error.code
    };
  }

  return {
    message: "Unexpected server error. Please try again."
  };
};
