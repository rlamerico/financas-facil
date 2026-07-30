"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  budgetSchema,
  type BudgetInput,
} from "@/utils/validation/budget-schema";
import {
  useCreateBudget,
  useUpdateBudget,
  type Budget,
} from "@/hooks/use-budgets";
import type { Category } from "@/hooks/use-categories";
import { MONTH_LABELS } from "@/utils/month-labels";

interface BudgetFormProps {
  profileId: string;
  categories: Category[];
  /** Mês/ano pré-selecionados na tela — usados como default ao criar. */
  defaultMonth: number;
  defaultYear: number;
  /** `null` = modo criação; presente = modo edição. */
  budget: Budget | null;
  onClose: () => void;
}

const GENERIC_SAVE_ERROR = "Não foi possível salvar a meta. Tente novamente.";
const UNIQUE_VIOLATION_CODE = "23505";
const DUPLICATE_ERROR =
  "Já existe uma meta para essa categoria neste mês/ano. Edite a meta existente.";

/**
 * Radix `Dialog` de criação/edição de meta (`budgets.planned_amount`).
 * Em edição, categoria/mês/ano ficam travados — `useUpdateBudget` só
 * altera `planned_amount` (é a única coisa que faz sentido reeditar depois
 * que uma meta já existe, dado o índice único `profile_id+category_id+
 * month+year`).
 */
export function BudgetForm({
  profileId,
  categories,
  defaultMonth,
  defaultYear,
  budget,
  onClose,
}: BudgetFormProps) {
  const isEditing = Boolean(budget);

  const [categoryId, setCategoryId] = useState(budget?.category_id ?? "");
  const [month, setMonth] = useState(budget?.month ?? defaultMonth);
  const [year, setYear] = useState(budget?.year ?? defaultYear);
  const [plannedAmount, setPlannedAmount] = useState(
    budget ? String(budget.planned_amount ?? 0) : "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createBudget = useCreateBudget(profileId);
  const updateBudget = useUpdateBudget(profileId);
  const isSaving = createBudget.isPending || updateBudget.isPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input: BudgetInput = {
      category_id: categoryId,
      month,
      year,
      planned_amount: Number(plannedAmount),
    };

    const result = budgetSchema.safeParse(input);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    try {
      if (isEditing && budget) {
        await updateBudget.mutateAsync({
          id: budget.id,
          planned_amount: result.data.planned_amount,
        });
      } else {
        await createBudget.mutateAsync(result.data);
      }
      onClose();
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      setErrors({
        form: code === UNIQUE_VIOLATION_CODE ? DUPLICATE_ERROR : GENERIC_SAVE_ERROR,
      });
    }
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 shadow-overlay animate-fade-up">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              {isEditing ? "Editar meta" : "Nova meta"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="text-muted hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="budget-category" className="text-sm font-medium">
                Categoria
              </label>
              <select
                id="budget-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                disabled={isEditing}
                className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.type === "income" ? "Receita" : "Despesa"})
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-xs text-error">{errors.category_id}</p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="budget-month" className="text-sm font-medium">
                  Mês
                </label>
                <select
                  id="budget-month"
                  value={month}
                  onChange={(event) => setMonth(Number(event.target.value))}
                  disabled={isEditing}
                  className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                >
                  {MONTH_LABELS.map((label, index) => (
                    <option key={label} value={index + 1}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label htmlFor="budget-year" className="text-sm font-medium">
                  Ano
                </label>
                <input
                  id="budget-year"
                  type="number"
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value))}
                  disabled={isEditing}
                  className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="budget-planned" className="text-sm font-medium">
                Valor planejado
              </label>
              <input
                id="budget-planned"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={plannedAmount}
                onChange={(event) => setPlannedAmount(event.target.value)}
                className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              {errors.planned_amount && (
                <p className="mt-1 text-xs text-error">{errors.planned_amount}</p>
              )}
            </div>

            {errors.form && <p className="text-sm text-error">{errors.form}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
