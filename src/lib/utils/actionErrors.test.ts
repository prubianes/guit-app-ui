import { describe, expect, it } from "vitest";
import { ApiClientError } from "$lib/api/errors";
import { errorToActionFail } from "$lib/utils/actionErrors";

describe("action error mapping", () => {
  it("maps backend details.path into fieldErrors", () => {
    const input = new ApiClientError({
      code: "VALIDATION_ERROR",
      message: "Invalid request body",
      status: 400,
      details: [
        {
          path: ["categoryId"],
          message: "Invalid input: expected number, received string"
        },
        {
          path: ["date"],
          message: "Invalid ISO datetime"
        }
      ]
    });

    const mapped = errorToActionFail(input);
    expect(mapped.code).toBe("VALIDATION_ERROR");
    expect(mapped.fieldErrors?.categoryId).toContain("expected number");
    expect(mapped.fieldErrors?.date).toContain("ISO datetime");
  });

  it("maps unauthorized errors to a session-expired message", () => {
    const input = new ApiClientError({
      code: "UNAUTHORIZED",
      message: "Invalid token",
      status: 401
    });

    const mapped = errorToActionFail(input);
    expect(mapped.code).toBe("UNAUTHORIZED");
    expect(mapped.message).toBe("Your session is no longer valid. Please sign in again.");
    expect(mapped.fieldErrors).toBeUndefined();
  });

  it("maps rate-limited errors to a retry-later message", () => {
    const input = new ApiClientError({
      code: "RATE_LIMITED",
      message: "Too many requests",
      status: 429
    });

    const mapped = errorToActionFail(input);
    expect(mapped.code).toBe("RATE_LIMITED");
    expect(mapped.message).toBe("Too many attempts. Please wait a moment and try again.");
    expect(mapped.fieldErrors).toBeUndefined();
  });
});
