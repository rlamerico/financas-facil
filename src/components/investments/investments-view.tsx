"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";
import { calculatePortfolioReturn } from "@/utils/portfolio-return";
import {
  useInvestments,
  useDeleteInvestment,
  type Investment,
} from "@/hooks/use-investments";
import { InvestmentForm } from "./investment-form";
import { InvestmentRow } from "./investment-row";

interface InvestmentsViewProps {
  profileId: string;
}

type FormState = { mode: "create" } | { mode: "edit"; investment: Investment };

/**
 * Client Component: carteira consolidada (valor investido, valor atual,
 * rentabilidade) + CRUD de investimentos. A regra de ouro se aplica aqui
 * também — só `profileId` (string) atravessa a fronteira Server → Client,
 * mesmo padrão de `CategoriesView`/`BudgetsSection`.
 */
export function InvestmentsView({ profileId }: InvestmentsViewProps) {
  const { data: investments, isLoading, isError } = useInvestments(profileId);
  const deleteInvestment = useDeleteInvestment(profileId);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const portfolio = useMemo(
    () =>
      calculatePortfolioReturn(
        (investments ?? []).map((investment) => ({
          id: investment.id,
          assetName: investment.asset_name,
          quantity: investment.quantity,
          averagePrice: investment.average_price,
          currentPrice: investment.current_price,
        })),
      ),
    [investments],
  );

  const returnRowById = useMemo(
    () => new Map(portfolio.rows.map((row) => [row.id, row])),
    [portfolio.rows],
  );

  const sortedInvestments = useMemo(
    () =>
      [...(investments ?? [])].sort((a, b) =>
        a.asset_name.localeCompare(b.asset_name),
      ),
    [investments],
  );

  const handleDelete = async (investment: Investment) => {
    const confirmed = window.confirm(
      `Excluir o investimento "${investment.asset_name}"?`,
    );
    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    try {
      await deleteInvestment.mutateAsync(investment.id);
    } catch {
      setDeleteError("Não foi possível excluir o investimento.");
    }
  };

  const hasAnyQuote = portfolio.totalReturnPercentage !== null;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface shadow-card p-4">
          <p className="text-xs font-medium text-muted">Valor investido</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatCurrency(portfolio.totalInvestedValue)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface shadow-card p-4">
          <p className="text-xs font-medium text-muted">Valor atual</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {hasAnyQuote ? formatCurrency(portfolio.totalCurrentValue) : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface shadow-card p-4">
          <p className="text-xs font-medium text-muted">Rentabilidade</p>
          <p
            className={cn(
              "mt-1 text-xl font-bold tabular-nums",
              !hasAnyQuote && "text-muted",
              hasAnyQuote && (portfolio.totalReturnPercentage ?? 0) >= 0
                ? "text-success"
                : "text-error",
            )}
          >
            {hasAnyQuote
              ? `${(portfolio.totalReturnPercentage ?? 0) >= 0 ? "+" : ""}${(
                  portfolio.totalReturnPercentage ?? 0
                ).toFixed(2)}%`
              : "Sem cotação"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Ativos</h2>
        <Button type="button" onClick={() => setFormState({ mode: "create" })}>
          <Plus className="h-4 w-4" aria-hidden />
          Novo investimento
        </Button>
      </div>

      {deleteError && <p className="mt-2 text-sm text-error">{deleteError}</p>}

      <div className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface shadow-card">
        {isLoading && (
          <p className="p-4 text-sm text-muted">Carregando investimentos...</p>
        )}
        {isError && (
          <p className="p-4 text-sm text-error">
            Não foi possível carregar os investimentos.
          </p>
        )}
        {!isLoading && !isError && sortedInvestments.length === 0 && (
          <p className="p-4 text-sm text-muted">Nenhum investimento cadastrado.</p>
        )}
        {sortedInvestments.map((investment) => {
          const returnRow = returnRowById.get(investment.id);
          if (!returnRow) {
            return null;
          }

          return (
            <InvestmentRow
              key={investment.id}
              investment={investment}
              returnRow={returnRow}
              onEdit={() => setFormState({ mode: "edit", investment })}
              onDelete={() => handleDelete(investment)}
            />
          );
        })}
      </div>

      {formState && (
        <InvestmentForm
          profileId={profileId}
          investment={formState.mode === "edit" ? formState.investment : null}
          onClose={() => setFormState(null)}
        />
      )}
    </div>
  );
}
