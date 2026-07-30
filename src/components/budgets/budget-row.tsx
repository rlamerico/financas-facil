"use client";

import { formatCurrency } from "@/utils/format";
import type { Budget } from "@/hooks/use-budgets";

interface BudgetRowProps {
  budget: Budget;
  categoryName: string;
  onEdit: () => void;
  onDelete: () => void;
}

/** Linha da lista de metas (Categorias > Metas) com ações de editar/excluir. */
export function BudgetRow({
  budget,
  categoryName,
  onEdit,
  onDelete,
}: BudgetRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <p className="truncate text-sm font-medium text-foreground">
        {categoryName}
      </p>

      <div className="flex shrink-0 items-center gap-4">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {formatCurrency(budget.planned_amount ?? 0)}
        </span>

        <div className="flex gap-3 text-xs font-medium">
          <button
            type="button"
            onClick={onEdit}
            className="text-secondary hover:underline"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-error hover:underline"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
