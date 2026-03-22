export class ApiClientError extends Error {
  code: string;
  details?: unknown;
  status: number;

  constructor(input: { code: string; message: string; status?: number; details?: unknown }) {
    super(input.message);
    this.name = "ApiClientError";
    this.code = input.code;
    this.status = input.status ?? 500;
    this.details = input.details;
  }
}

export const AUTH_FAILURE_CODES = new Set(["UNAUTHORIZED", "INVALID_TOKEN", "AUTH_EXPIRED"]);

export const isAuthFailure = (error: unknown) =>
  error instanceof ApiClientError &&
  (error.status === 401 || AUTH_FAILURE_CODES.has(error.code));

export const userMessageForCode = (code?: string) => {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return "The email or password is incorrect.";
    case "UNAUTHORIZED":
      return "Your session is no longer valid. Please sign in again.";
    case "VALIDATION_ERROR":
      return "Please review the form values and try again.";
    case "CATEGORY_NOT_FOUND":
      return "Selected category was not found. It may have been removed.";
    case "ACCOUNT_NOT_FOUND":
      return "Selected account was not found. It may have been removed.";
    case "RATE_LIMITED":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Something went wrong while talking to the server.";
  }
};
