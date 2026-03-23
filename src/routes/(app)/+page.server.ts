import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const [accounts, transactions, budgets] = await Promise.all([
      locals.api.accountsList(),
      locals.api.transactionsList(),
      locals.api.budgetsList()
    ]);

    const balanceTotal = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
    const expenseTotal = transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const incomeTotal = transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const netFlow = incomeTotal - expenseTotal;
    const avgTransaction = transactions.length > 0 ? (incomeTotal + expenseTotal) / transactions.length : 0;

    const thirtyDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 30;
    const recentTransactions = transactions.filter((transaction) => {
      const raw = transaction.date ?? transaction.occurredAt;
      const timestamp = raw ? new Date(raw).getTime() : Number.NaN;
      return Number.isFinite(timestamp) && timestamp >= thirtyDaysAgo;
    }).length;

    return {
      stats: {
        accounts: accounts.length,
        transactions: transactions.length,
        budgets: budgets.length,
        balanceTotal,
        expenseTotal,
        incomeTotal,
        netFlow,
        avgTransaction,
        recentTransactions
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
        expenseTotal: 0,
        incomeTotal: 0,
        netFlow: 0,
        avgTransaction: 0,
        recentTransactions: 0
      },
      loadError: error instanceof Error ? error.message : "Failed to load dashboard."
    };
  }
};
