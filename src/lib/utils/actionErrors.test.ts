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
});
