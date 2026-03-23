import { describe, expect, it } from "vitest";
import {
  adaptCategoryInput,
  adaptTransactionInput,
  normalizeAuthResult,
  toIsoDatetime
} from "$lib/api/adapters";

describe("api adapters", () => {
  it("normalizes date-only strings to ISO datetime UTC", () => {
    expect(toIsoDatetime("2026-03-22")).toBe("2026-03-22T00:00:00.000Z");
  });

  it("adapts category payload with compatible type/kind fields", () => {
    expect(adaptCategoryInput({ name: "Food", kind: "expense" })).toEqual({
      name: "Food",
      type: "expense",
      kind: "expense"
    });
  });

  it("adapts transaction payload to numeric ids and ISO date", () => {
    expect(
      adaptTransactionInput({
        accountId: "10",
        categoryId: "20",
        amount: 50,
        type: "expense",
        date: "2026-03-22"
      })
    ).toMatchObject({
      accountId: 10,
      categoryId: 20,
      amount: 50,
      type: "expense",
      date: "2026-03-22T00:00:00.000Z",
      occurredAt: "2026-03-22T00:00:00.000Z"
    });
  });

  it("normalizes auth payload with snake_case token fields", () => {
    const result = normalizeAuthResult({
      access_token: "a",
      refresh_token: "r",
      user: {
        id: 1,
        email: "user@example.com",
        first_name: "Test",
        last_name: "User"
      }
    });

    expect(result.accessToken).toBe("a");
    expect(result.refreshToken).toBe("r");
    expect(result.user.email).toBe("user@example.com");
    expect(result.user.firstName).toBe("Test");
  });
});
