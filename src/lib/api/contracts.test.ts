import { describe, expect, it } from "vitest";
import {
  accountListSchema,
  budgetListSchema,
  categoryListSchema,
  transactionListSchema
} from "$lib/api/contracts";

describe("api contracts list schemas", () => {
  it("unwraps wrapped category lists", () => {
    const parsed = categoryListSchema.safeParse({
      categories: [{ id: 1, name: "Food", type: "expense" }]
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toHaveLength(1);
      expect(parsed.data[0].kind).toBe("expense");
    }
  });

  it("unwraps wrapped transaction lists", () => {
    const parsed = transactionListSchema.safeParse({
      transactions: [
        {
          id: 1,
          accountId: 10,
          categoryId: 20,
          amount: 100,
          type: "expense",
          date: "2026-03-22T00:00:00.000Z"
        }
      ]
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data[0].accountId).toBe(10);
    }
  });

  it("unwraps wrapped budget lists", () => {
    const parsed = budgetListSchema.safeParse({
      budgets: [{ id: 1, categoryId: 2, amount: 300, period: "monthly" }]
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data[0].period).toBe("monthly");
    }
  });

  it("unwraps generic account item list", () => {
    const parsed = accountListSchema.safeParse({
      items: [{ id: "a1", name: "Main", type: "checking", currency: "usd", balance: "50.5" }]
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data[0].currency).toBe("USD");
      expect(parsed.data[0].balance).toBe(50.5);
    }
  });
});
