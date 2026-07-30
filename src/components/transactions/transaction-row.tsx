"use client";

import { cn } from "@/utils/cn";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Transaction } from "@/hooks/use-transactions";

interface TransactionRowProps {
  transaction: Transaction;
  categoryName: string | null;
  onEdit: () => void;
  onDelete: () => void;
}

/** Linha da lista de transações com ações de editar/excluir. */
export function TransactionRow({
  transaction,
  categoryName,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const isIncome = transaction.amount >= 0;

  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {transaction.description}
        </p>
        <p className="text-xs text-muted">
          {formatDate(transaction.date)}
          {categoryName ? ` · ${categoryName}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            isIncome ? "text-success" : "text-error",
          )}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(Math.abs(transaction.amount))}
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
