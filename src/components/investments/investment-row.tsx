"use client";

import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";
import type { PortfolioReturnRow } from "@/utils/portfolio-return";
import type { Investment } from "@/hooks/use-investments";

interface InvestmentRowProps {
  investment: Investment;
  returnRow: PortfolioReturnRow;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Linha da lista de investimentos: ativo, tipo, quantidade, valor investido,
 * valor atual e rentabilidade (%). Quando o ativo ainda não tem
 * `current_price` informado, mostra "Sem cotação" em vez de tratar como 0%.
 */
export function InvestmentRow({
  investment,
  returnRow,
  onEdit,
  onDelete,
}: InvestmentRowProps) {
  const hasQuote = returnRow.returnPercentage !== null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {investment.asset_name}
        </p>
        <p className="text-xs text-muted">
          {investment.asset_type} · {investment.quantity} un. · preço médio{" "}
          {formatCurrency(investment.average_price)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {hasQuote
              ? formatCurrency(returnRow.currentValue ?? 0)
              : formatCurrency(returnRow.investedValue)}
          </p>
          <p
            className={cn(
              "text-xs tabular-nums",
              !hasQuote && "text-muted",
              hasQuote && (returnRow.returnPercentage ?? 0) >= 0
                ? "text-success"
                : "text-error",
            )}
          >
            {hasQuote
              ? `${(returnRow.returnPercentage ?? 0) >= 0 ? "+" : ""}${(
                  returnRow.returnPercentage ?? 0
                ).toFixed(2)}%`
              : "Sem cotação"}
          </p>
        </div>

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
