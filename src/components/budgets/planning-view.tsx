"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCategories } from "@/hooks/use-categories";
import { useBudgets } from "@/hooks/use-budgets";
import { useTransactions } from "@/hooks/use-transactions";
import { calculateBudgetVariance } from "@/utils/budget-variance";
import { formatCurrency } from "@/utils/format";
import { MONTH_LABELS } from "@/utils/month-labels";
import { cn } from "@/utils/cn";

interface PlanningViewProps {
  profileId: string;
}

/** Página maior que o padrão: precisa de todas as transações do mês, não só a 1ª leva. */
const TRANSACTIONS_PAGE_SIZE = 500;

/**
 * Client Component: tabela Planejado × Realizado por categoria para o
 * mês/ano selecionado. Cruza as metas (`useBudgets`) com as transações do
 * período (`useTransactions`) via `calculateBudgetVariance` — o realizado
 * nunca vem da coluna `budgets.actual_amount` (que ninguém mantém
 * atualizada), sempre das transações reais.
 */
export function PlanningView({ profileId }: PlanningViewProps) {
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: categories } = useCategories();
  const {
    data: budgets,
    isLoading: isLoadingBudgets,
    isError: isErrorBudgets,
  } = useBudgets(profileId, month, year);

  const transactionFilters = useMemo(() => ({ month, year }), [month, year]);
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    isError: isErrorTransactions,
  } = useTransactions(profileId, transactionFilters, TRANSACTIONS_PAGE_SIZE);

  const categoryById = useMemo(
    () => new Map((categories ?? []).map((category) => [category.id, category])),
    [categories],
  );

  const rows = useMemo(() => {
    const goals = (budgets ?? []).map((budget) => ({
      categoryId: budget.category_id,
      plannedAmount: budget.planned_amount ?? 0,
    }));
    const transactions = (transactionsData?.pages.flat() ?? []).map(
      (transaction) => ({
        categoryId: transaction.category_id,
        amount: transaction.amount,
      }),
    );

    return calculateBudgetVariance(goals, transactions).sort((a, b) => {
      const nameA = categoryById.get(a.categoryId)?.name ?? "";
      const nameB = categoryById.get(b.categoryId)?.name ?? "";
      return nameA.localeCompare(nameB);
    });
  }, [budgets, transactionsData, categoryById]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          planned: acc.planned + row.planned,
          actual: acc.actual + row.actual,
          variance: acc.variance + row.variance,
        }),
        { planned: 0, actual: 0, variance: 0 },
      ),
    [rows],
  );

  const isLoading = isLoadingBudgets || isLoadingTransactions;
  const isError = isErrorBudgets || isErrorTransactions;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-border bg-surface shadow-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted">Mês</span>
            <select
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
              className="rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm"
            >
              {MONTH_LABELS.map((label, index) => (
                <option key={label} value={index + 1}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted">Ano</span>
            <input
              type="number"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="w-24 rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>

        <Link
          href="/categorias"
          className="text-xs font-medium text-secondary hover:underline"
        >
          Gerenciar metas
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface shadow-card">
        {isLoading && (
          <p className="p-4 text-sm text-muted">Carregando planejamento...</p>
        )}
        {isError && (
          <p className="p-4 text-sm text-error">
            Não foi possível carregar os dados de planejamento.
          </p>
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <p className="p-4 text-sm text-muted">
            Nenhuma meta cadastrada para {MONTH_LABELS[month - 1]}/{year}.{" "}
            <Link href="/categorias" className="text-secondary hover:underline">
              Criar uma meta
            </Link>
            .
          </p>
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted">
                <th className="p-4">Categoria</th>
                <th className="p-4 text-right">Planejado</th>
                <th className="p-4 text-right">Realizado</th>
                <th className="p-4 text-right">Variação</th>
                <th className="p-4 text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const isOverBudget = row.variance < 0;
                return (
                  <tr key={row.categoryId}>
                    <td className="p-4 font-medium text-foreground">
                      {categoryById.get(row.categoryId)?.name ?? "Categoria"}
                    </td>
                    <td className="p-4 text-right tabular-nums text-foreground">
                      {formatCurrency(row.planned)}
                    </td>
                    <td className="p-4 text-right tabular-nums text-foreground">
                      {formatCurrency(row.actual)}
                    </td>
                    <td
                      className={cn(
                        "p-4 text-right tabular-nums font-semibold",
                        isOverBudget ? "text-error" : "text-success",
                      )}
                    >
                      {isOverBudget ? "-" : "+"}
                      {formatCurrency(Math.abs(row.variance))}
                    </td>
                    <td
                      className={cn(
                        "p-4 text-right tabular-nums",
                        row.percentage !== null && row.percentage > 100
                          ? "text-error"
                          : "text-muted",
                      )}
                    >
                      {row.percentage === null ? "—" : `${row.percentage.toFixed(0)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border text-sm font-semibold">
                <td className="p-4 text-foreground">Total</td>
                <td className="p-4 text-right tabular-nums text-foreground">
                  {formatCurrency(totals.planned)}
                </td>
                <td className="p-4 text-right tabular-nums text-foreground">
                  {formatCurrency(totals.actual)}
                </td>
                <td
                  className={cn(
                    "p-4 text-right tabular-nums",
                    totals.variance < 0 ? "text-error" : "text-success",
                  )}
                >
                  {totals.variance < 0 ? "-" : "+"}
                  {formatCurrency(Math.abs(totals.variance))}
                </td>
                <td className="p-4" />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
