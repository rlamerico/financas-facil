import type { ReportPeriod } from "./report-periods";

export interface BudgetForPeriod {
  plannedAmount: number | null;
}

export interface TransactionForPeriod {
  /** ISO `YYYY-MM-DD`. */
  date: string;
  amount: number;
}

export interface MonthlyPlannedActualRow {
  label: string;
  planned: number;
  actual: number;
}

/**
 * Agrega Planejado × Realizado por mês pro gráfico de barras dos Relatórios
 * (PRD §2.2 módulo 6). `budgetsByPeriod[i]` já vem filtrado por mês/ano na
 * própria query (`useBudgets` chamado uma vez por período) — aqui só soma;
 * o realizado é derivado das transações reais (mesma fonte de verdade do
 * Planejamento Mensal, nunca de `budgets.actual_amount`).
 */
export function aggregateMonthlyPlannedVsActual(
  periods: ReportPeriod[],
  budgetsByPeriod: BudgetForPeriod[][],
  transactions: TransactionForPeriod[],
): MonthlyPlannedActualRow[] {
  return periods.map((period, index) => {
    const budgets = budgetsByPeriod[index] ?? [];
    const planned = budgets.reduce(
      (sum, budget) => sum + (budget.plannedAmount ?? 0),
      0,
    );

    const actual = transactions
      .filter((transaction) => isInPeriod(transaction.date, period))
      .filter((transaction) => transaction.amount < 0)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    return { label: period.label, planned, actual };
  });
}

function isInPeriod(dateIso: string, period: ReportPeriod): boolean {
  const [yearStr, monthStr] = dateIso.split("-");
  return Number(yearStr) === period.year && Number(monthStr) === period.month;
}
