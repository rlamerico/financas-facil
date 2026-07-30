import {
  summarizeTransactions,
  type FinanceSummary,
  type TransactionAmount,
} from "./finance-summary";

export interface DatedTransaction extends TransactionAmount {
  date: string;
}

export interface PeriodComparison {
  current: FinanceSummary;
  previous: FinanceSummary;
  balanceDeltaPct: number | null;
  incomeDeltaPct: number | null;
  expensesDeltaPct: number | null;
}

/**
 * Variação percentual entre períodos. Base = |anterior| pra que uma melhora
 * partindo de saldo negativo apareça como delta positivo. `null` quando não
 * há base de comparação (período anterior zerado).
 */
function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Divide transações em período atual (`date >= boundaryIsoDate`) e anterior,
 * resume cada um e calcula as variações percentuais dos stat cards do
 * Dashboard. Datas ISO (`YYYY-MM-DD`) comparam corretamente como string.
 */
export function comparePeriods<T extends DatedTransaction>(
  transactions: T[],
  boundaryIsoDate: string,
): PeriodComparison {
  const current = summarizeTransactions(
    transactions.filter((transaction) => transaction.date >= boundaryIsoDate),
  );
  const previous = summarizeTransactions(
    transactions.filter((transaction) => transaction.date < boundaryIsoDate),
  );

  return {
    current,
    previous,
    balanceDeltaPct: deltaPct(current.balance, previous.balance),
    incomeDeltaPct: deltaPct(current.income, previous.income),
    expensesDeltaPct: deltaPct(current.expenses, previous.expenses),
  };
}
