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

    return {
      message: userMessageForCode(error.code) || error.message,
      code: error.code
    };
  }

  console.error("Unexpected action error:", error);

  return {
    message: "Unexpected server error. Please try again."
  };
};
