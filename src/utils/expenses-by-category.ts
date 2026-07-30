export interface TransactionForCategoryGrouping {
  categoryId: string | null;
  amount: number;
}

export interface CategoryForGrouping {
  id: string;
  name: string;
  color?: string | null;
}

export interface CategoryExpenseSlice {
  categoryId: string;
  name: string;
  /** Soma absoluta das despesas (amount < 0) da categoria no período. */
  total: number;
  color: string | null;
}

const UNCATEGORIZED_ID = "uncategorized";
const UNCATEGORIZED_NAME = "Sem categoria";

/**
 * Agrupa despesas (`amount < 0`) por categoria pro gráfico de pizza dos
 * Relatórios. Ignora receitas (`amount > 0`) — o gráfico de pizza do PRD
 * §2.2 módulo 6 é especificamente "gastos por categoria". Transações sem
 * `categoryId` caem no grupo "Sem categoria" em vez de serem descartadas,
 * pra não fazer o total do gráfico divergir do total real de despesas do
 * período. Resultado ordenado do maior pro menor gasto.
 */
export function groupExpensesByCategory(
  transactions: TransactionForCategoryGrouping[],
  categories: CategoryForGrouping[],
): CategoryExpenseSlice[] {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const totalsByCategory = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.amount >= 0) {
      continue;
    }

    const categoryId = transaction.categoryId ?? UNCATEGORIZED_ID;
    const current = totalsByCategory.get(categoryId) ?? 0;
    totalsByCategory.set(categoryId, current + Math.abs(transaction.amount));
  }

  const slices: CategoryExpenseSlice[] = Array.from(
    totalsByCategory.entries(),
  ).map(([categoryId, total]) => {
    if (categoryId === UNCATEGORIZED_ID) {
      return { categoryId, name: UNCATEGORIZED_NAME, total, color: null };
    }

    const category = categoryById.get(categoryId);
    return {
      categoryId,
      name: category?.name ?? UNCATEGORIZED_NAME,
      total,
      color: category?.color ?? null,
    };
  });

  return slices.sort((a, b) => b.total - a.total);
}
