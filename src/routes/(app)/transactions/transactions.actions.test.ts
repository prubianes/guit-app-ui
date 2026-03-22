import { describe, expect, it, vi } from "vitest";
import { actions } from "./+page.server";

const makeRequest = (fields: Record<string, string>) => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return new Request("http://localhost/transactions", {
    method: "POST",
    body: formData
  });
};

describe("transactions actions", () => {
  it("returns consistent success response on create", async () => {
    const transactionCreate = vi.fn().mockResolvedValue({});
    const result = await actions.create({
      request: makeRequest({
        accountId: "1",
        categoryId: "2",
        amount: "99.5",
        type: "expense",
        occurredAt: "2026-03-22"
      }),
      locals: {
        api: {
          transactionCreate
        }
      }
    } as never);

    expect(result).toEqual({
      success: true,
      message: "Transaction created."
    });
    expect(transactionCreate).toHaveBeenCalled();
  });

  it("returns 400 + fieldErrors on invalid payload", async () => {
    const result = await actions.create({
      request: makeRequest({
        accountId: "",
        categoryId: "",
        amount: "-1",
        type: "expense",
        occurredAt: ""
      }),
      locals: {
        api: {
          transactionCreate: vi.fn()
        }
      }
    } as never);

    expect((result as { status?: number }).status).toBe(400);
    expect((result as { data?: { success?: boolean; fieldErrors?: Record<string, string> } }).data?.success).toBe(
      false
    );
    expect(
      (result as { data?: { fieldErrors?: Record<string, string> } }).data?.fieldErrors?.date
    ).toBeTruthy();
  });
});
