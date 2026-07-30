export interface BudgetGoal {
  categoryId: string;
  plannedAmount: number;
}

export interface TransactionForVariance {
  categoryId: string | null;
  amount: number;
}

export interface BudgetVarianceRow {
  categoryId: string;
  planned: number;
  /** Soma absoluta das transações do mês na categoria (Realizado). */
  actual: number;
  /** `planned - actual`. Positivo = sobrou orçamento, negativo = estourou. */
  variance: number;
  /**
   * `actual / planned * 100`. `null` quando `planned` é 0 e há realizado
   * (percentual não é definível — a UI mostra algo como "—" nesse caso).
   */
  percentage: number | null;
}

/**
 * Calcula Planejado × Realizado por categoria a partir das metas
 * (`budgets.planned_amount`) e das transações do mês/ano correspondente.
 *
 * `actual_amount` é uma coluna em `budgets`, mas fica facilmente
 * desatualizada (nada a recalcula quando uma transação muda); esta função
 * deriva o realizado direto das transações reais, a mesma fonte de verdade
 * usada por `summarizeTransactions` no Dashboard — a tela de Planejamento
 * Mensal já filtra as transações pelo mês/ano antes de chamar esta função.
 */
export function calculateBudgetVariance(
  goals: BudgetGoal[],
  transactions: TransactionForVariance[],
): BudgetVarianceRow[] {
  return goals.map((goal) => {
    const actual = transactions
      .filter((transaction) => transaction.categoryId === goal.categoryId)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    const variance = goal.plannedAmount - actual;
    const percentage =
      goal.plannedAmount > 0 ? (actual / goal.plannedAmount) * 100 : null;

    return {
      categoryId: goal.categoryId,
      planned: goal.plannedAmount,
      actual,
      variance,
      percentage,
    };
  });
}
