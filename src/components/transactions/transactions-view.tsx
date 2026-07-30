"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-categories";
import {
  useDeleteTransaction,
  useTransactions,
  type Transaction,
  type TransactionFilters,
} from "@/hooks/use-transactions";
import { MONTH_LABELS } from "@/utils/month-labels";
import { TransactionForm } from "./transaction-form";
import { TransactionRow } from "./transaction-row";

interface TransactionsViewProps {
  profileId: string;
}

type FormState = { mode: "create" } | { mode: "edit"; transaction: Transaction };

/**
 * Client Component com filtros (mês/ano, categoria, tipo), lista paginada
 * ("carregar mais") e o modal de criação/edição de transações.
 */
export function TransactionsView({ profileId }: TransactionsViewProps) {
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<"" | "income" | "expense">("");
  const [formState, setFormState] = useState<FormState | null>(null);

  const filters: TransactionFilters = useMemo(
    () => ({
      month,
      year,
      categoryId: categoryId || undefined,
      type: type || undefined,
    }),
    [month, year, categoryId, type],
  );

  const { data: categories } = useCategories();
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactions(profileId, filters);
  const deleteTransaction = useDeleteTransaction(profileId);

  const transactions = useMemo(
    () => data?.pages.flat() ?? [],
    [data],
  );
  const categoryById = useMemo(
    () => new Map((categories ?? []).map((category) => [category.id, category])),
    [categories],
  );

  const handleDelete = (transaction: Transaction) => {
    const confirmed = window.confirm(
      `Excluir a transação "${transaction.description}"?`,
    );
    if (!confirmed) {
      return;
    }
    deleteTransaction.mutate(transaction.id);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface shadow-card p-4">
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

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-muted">Categoria</span>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {(categories ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-muted">Tipo</span>
          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value as "" | "income" | "expense")
            }
            className="rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
        </label>

        <Button
          type="button"
          className="ml-auto"
          onClick={() => setFormState({ mode: "create" })}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nova transação
        </Button>
      </div>

      <div className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface shadow-card">
        {isLoading && (
          <p className="p-4 text-sm text-muted">Carregando transações...</p>
        )}
        {isError && (
          <p className="p-4 text-sm text-error">
            Não foi possível carregar as transações.
          </p>
        )}
        {!isLoading && !isError && transactions.length === 0 && (
          <p className="p-4 text-sm text-muted">
            Nenhuma transação encontrada para o período.
          </p>
        )}
        {transactions.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            categoryName={
              transaction.category_id
                ? (categoryById.get(transaction.category_id)?.name ?? null)
                : null
            }
            onEdit={() => setFormState({ mode: "edit", transaction })}
            onDelete={() => handleDelete(transaction)}
          />
        ))}
      </div>

      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}

      {formState && (
        <TransactionForm
          profileId={profileId}
          categories={categories ?? []}
          transaction={formState.mode === "edit" ? formState.transaction : null}
          onClose={() => setFormState(null)}
        />
      )}
    </div>
  );
}
