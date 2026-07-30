"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import {
  transactionSchema,
  toSignedAmount,
  type TransactionInput,
} from "@/utils/validation/transaction-schema";
import {
  useCreateTransaction,
  useUpdateTransaction,
  type Transaction,
} from "@/hooks/use-transactions";
import type { Category } from "@/hooks/use-categories";

interface TransactionFormProps {
  profileId: string;
  categories: Category[];
  /** `null` = modo criação; presente = modo edição. */
  transaction: Transaction | null;
  onClose: () => void;
}

const GENERIC_SAVE_ERROR = "Não foi possível salvar a transação. Tente novamente.";

function toDateInputValue(date: string): string {
  return date.slice(0, 10);
}

/**
 * Radix `Dialog` usado tanto pra criar quanto editar uma transação.
 * Mutação client-side (não Server Action) porque o modal precisa de
 * feedback otimista/de erro inline sem navegação, e já usa o client
 * Supabase do browser via os hooks de `use-transactions`.
 */
export function TransactionForm({
  profileId,
  categories,
  transaction,
  onClose,
}: TransactionFormProps) {
  const isEditing = Boolean(transaction);

  const [description, setDescription] = useState(
    transaction?.description ?? "",
  );
  const [amount, setAmount] = useState(
    transaction ? String(Math.abs(transaction.amount)) : "",
  );
  const [date, setDate] = useState(
    transaction
      ? toDateInputValue(transaction.date)
      : new Date().toISOString().slice(0, 10),
  );
  const [type, setType] = useState<"income" | "expense">(
    transaction ? (transaction.amount < 0 ? "expense" : "income") : "expense",
  );
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createTransaction = useCreateTransaction(profileId);
  const updateTransaction = useUpdateTransaction(profileId);
  const isSaving = createTransaction.isPending || updateTransaction.isPending;

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input: TransactionInput = {
      description,
      amount: Number(amount),
      date,
      category_id: categoryId || null,
      type,
    };

    const result = transactionSchema.safeParse(input);
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
    const signedAmount = toSignedAmount(result.data);

    try {
      if (isEditing && transaction) {
        await updateTransaction.mutateAsync({
          id: transaction.id,
          description: result.data.description,
          amount: signedAmount,
          date: result.data.date,
          category_id: result.data.category_id,
        });
      } else {
        await createTransaction.mutateAsync({
          description: result.data.description,
          amount: signedAmount,
          date: result.data.date,
          category_id: result.data.category_id,
        });
      }
      onClose();
    } catch {
      setErrors({ form: GENERIC_SAVE_ERROR });
    }
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 shadow-overlay animate-fade-up">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              {isEditing ? "Editar transação" : "Nova transação"}
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
            <div className="flex gap-2">
              {(["expense", "income"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setType(option);
                    setCategoryId("");
                  }}
                  className={cn(
                    "flex-1 rounded-[var(--radius)] border px-3 py-2 text-sm font-medium transition-colors",
                    type === option
                      ? option === "income"
                        ? "border-success bg-success/10 text-success"
                        : "border-error bg-error/10 text-error"
                      : "border-border text-muted hover:bg-background",
                  )}
                >
                  {option === "income" ? "Receita" : "Despesa"}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="description" className="text-sm font-medium">
                Descrição
              </label>
              <input
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-error">{errors.description}</p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="amount" className="text-sm font-medium">
                  Valor
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                {errors.amount && (
                  <p className="mt-1 text-xs text-error">{errors.amount}</p>
                )}
              </div>

              <div className="flex-1">
                <label htmlFor="date" className="text-sm font-medium">
                  Data
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                {errors.date && (
                  <p className="mt-1 text-xs text-error">{errors.date}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="category" className="text-sm font-medium">
                Categoria
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">Sem categoria</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-xs text-error">{errors.category_id}</p>
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
