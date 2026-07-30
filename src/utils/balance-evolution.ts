import type { ReportPeriod } from "./report-periods";

export interface TransactionForBalance {
  /** ISO `YYYY-MM-DD`. */
  date: string;
  amount: number;
}

export interface BalanceEvolutionPoint {
  label: string;
  /** Saldo acumulado até o fim do período (inclusive). */
  balance: number;
}

/**
 * Calcula a evolução do saldo acumulado mês a mês pro gráfico de linha dos
 * Relatórios (PRD §2.2 módulo 6). Soma o líquido (receitas - despesas, via
 * `amount` já assinado) de cada período e acumula progressivamente — o
 * saldo acumulado é relativo à janela de transações carregada (últimos N
 * meses), não ao saldo histórico total da conta.
 */
export function calculateBalanceEvolution(
  periods: ReportPeriod[],
  transactions: TransactionForBalance[],
): BalanceEvolutionPoint[] {
  let runningBalance = 0;

  return periods.map((period) => {
    const net = transactions
      .filter((transaction) => isInPeriod(transaction.date, period))
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    runningBalance += net;

    return { label: period.label, balance: runningBalance };
  });
}

function isInPeriod(dateIso: string, period: ReportPeriod): boolean {
  const [yearStr, monthStr] = dateIso.split("-");
  return Number(yearStr) === period.year && Number(monthStr) === period.month;
}
