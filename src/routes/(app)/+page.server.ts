import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const [accounts, transactions, budgets] = await Promise.all([
      locals.api.accountsList(),
      locals.api.transactionsList(),
      locals.api.budgetsList()
    ]);

    const balanceTotal = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
    const monthlyExpenses = transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    return {
      stats: {
        accounts: accounts.length,
        transactions: transactions.length,
        budgets: budgets.length,
        balanceTotal,
        monthlyExpenses
      },
      loadError: null
    };
  } catch (error) {
    return {
      stats: {
        accounts: 0,
        transactions: 0,
        budgets: 0,
        balanceTotal: 0,
        monthlyExpenses: 0
      },
      loadError: error instanceof Error ? error.message : "Failed to load dashboard."
    };
  }
};
