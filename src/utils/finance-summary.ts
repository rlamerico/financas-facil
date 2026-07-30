export interface TransactionAmount {
  amount: number;
}

export interface FinanceSummary {
  balance: number;
  income: number;
  expenses: number;
}

const EMPTY_SUMMARY: FinanceSummary = { balance: 0, income: 0, expenses: 0 };

/**
 * Resume um conjunto de transações em saldo/receitas/despesas.
 *
 * Convenção de sinal (definida em `transaction-schema.ts`): `amount > 0` é
 * receita, `amount < 0` é despesa. Função pura, sem I/O — fácil de testar
 * com fixtures e reutilizar tanto no Dashboard quanto em relatórios futuros.
 */
export function summarizeTransactions<T extends TransactionAmount>(
  transactions: T[],
): FinanceSummary {
  return transactions.reduce<FinanceSummary>((summary, transaction) => {
    const { amount } = transaction;

    return {
      balance: summary.balance + amount,
      income: summary.income + (amount > 0 ? amount : 0),
      expenses: summary.expenses + (amount < 0 ? Math.abs(amount) : 0),
    };
  }, EMPTY_SUMMARY);
}
