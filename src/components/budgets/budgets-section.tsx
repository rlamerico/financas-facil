"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-categories";
import { useBudgets, useDeleteBudget, type Budget } from "@/hooks/use-budgets";
import { MONTH_LABELS } from "@/utils/month-labels";
import { BudgetForm } from "./budget-form";
import { BudgetRow } from "./budget-row";

interface BudgetsSectionProps {
  profileId: string;
}

type FormState = { mode: "create" } | { mode: "edit"; budget: Budget };

/**
 * Seção "Metas" da página de Categorias: seletor de mês/ano + CRUD de
 * `budgets.planned_amount` por categoria. Fica na mesma página de
 * Categorias (não uma rota própria) porque criar uma meta depende de já
 * existir a categoria — mantém o fluxo num só lugar.
 */
export function BudgetsSection({ profileId }: BudgetsSectionProps) {
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [formState, setFormState] = useState<FormState | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: categories } = useCategories();
  const { data: budgets, isLoading, isError } = useBudgets(profileId, month, year);
  const deleteBudget = useDeleteBudget(profileId);

  const categoryById = useMemo(
    () => new Map((categories ?? []).map((category) => [category.id, category])),
    [categories],
  );

  const sortedBudgets = useMemo(
    () =>
      [...(budgets ?? [])].sort((a, b) => {
        const nameA = categoryById.get(a.category_id)?.name ?? "";
        const nameB = categoryById.get(b.category_id)?.name ?? "";
        return nameA.localeCompare(nameB);
      }),
    [budgets, categoryById],
  );

  const handleDelete = async (budget: Budget) => {
    const categoryName = categoryById.get(budget.category_id)?.name ?? "esta meta";
    const confirmed = window.confirm(`Excluir a meta de "${categoryName}"?`);
    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    try {
      await deleteBudget.mutateAsync(budget.id);
    } catch {
      setDeleteError("Não foi possível excluir a meta.");
    }
  };

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Metas</h2>
          <p className="text-sm text-muted">
            Valor planejado por categoria em cada mês.
          </p>
        </div>

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

          <Button type="button" onClick={() => setFormState({ mode: "create" })}>
            <Plus className="h-4 w-4" aria-hidden />
            Nova meta
          </Button>
        </div>
      </div>

      {deleteError && <p className="mt-2 text-sm text-error">{deleteError}</p>}

      <div className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface shadow-card">
        {isLoading && (
          <p className="p-4 text-sm text-muted">Carregando metas...</p>
        )}
        {isError && (
          <p className="p-4 text-sm text-error">
            Não foi possível carregar as metas.
          </p>
        )}
        {!isLoading && !isError && sortedBudgets.length === 0 && (
          <p className="p-4 text-sm text-muted">
            Nenhuma meta cadastrada para {MONTH_LABELS[month - 1]}/{year}.
          </p>
        )}
        {sortedBudgets.map((budget) => (
          <BudgetRow
            key={budget.id}
            budget={budget}
            categoryName={categoryById.get(budget.category_id)?.name ?? "Categoria"}
            onEdit={() => setFormState({ mode: "edit", budget })}
            onDelete={() => handleDelete(budget)}
          />
        ))}
      </div>

      {formState && (
        <BudgetForm
          profileId={profileId}
          categories={categories ?? []}
          defaultMonth={month}
          defaultYear={year}
          budget={formState.mode === "edit" ? formState.budget : null}
          onClose={() => setFormState(null)}
        />
      )}
    </div>
  );
}
