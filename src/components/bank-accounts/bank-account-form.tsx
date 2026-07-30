"use client";

import { useState, useId, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  bankAccountSchema,
  ACCOUNT_TYPE_SUGGESTIONS,
  type BankAccountInput,
} from "@/utils/validation/bank-account-schema";
import {
  useCreateBankAccount,
  useUpdateBankAccount,
  type BankAccount,
} from "@/hooks/use-bank-accounts";

interface BankAccountFormProps {
  profileId: string;
  /** `null` = modo criação; presente = modo edição. */
  account: BankAccount | null;
  onClose: () => void;
}

const GENERIC_SAVE_ERROR = "Não foi possível salvar a conta. Tente novamente.";

/**
 * Radix `Dialog` usado tanto pra criar quanto editar uma conta bancária —
 * mesmo padrão de `InvestmentForm`. Sem conciliação bancária automática: o
 * saldo é editado manualmente pelo usuário nesta fase.
 */
export function BankAccountForm({
  profileId,
  account,
  onClose,
}: BankAccountFormProps) {
  const isEditing = Boolean(account);
  const accountTypeListId = useId();

  const [name, setName] = useState(account?.name ?? "");
  const [bankName, setBankName] = useState(account?.bank_name ?? "");
  const [accountType, setAccountType] = useState(account?.account_type ?? "");
  const [balance, setBalance] = useState(
    account ? String(account.balance ?? 0) : "0",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createBankAccount = useCreateBankAccount(profileId);
  const updateBankAccount = useUpdateBankAccount(profileId);
  const isSaving = createBankAccount.isPending || updateBankAccount.isPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input: BankAccountInput = {
      name,
      bank_name: bankName.trim() === "" ? null : bankName,
      account_type: accountType.trim() === "" ? null : accountType,
      balance: Number(balance),
    };

    const result = bankAccountSchema.safeParse(input);
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
      if (isEditing && account) {
        await updateBankAccount.mutateAsync({ id: account.id, ...result.data });
      } else {
        await createBankAccount.mutateAsync(result.data);
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
              {isEditing ? "Editar conta bancária" : "Nova conta bancária"}
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
              <label htmlFor="bank-account-name" className="text-sm font-medium">
                Nome da conta
              </label>
              <input
                id="bank-account-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex: Conta Corrente Principal"
                className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="bank-account-bank-name" className="text-sm font-medium">
                Banco (opcional)
              </label>
              <input
                id="bank-account-bank-name"
                value={bankName ?? ""}
                onChange={(event) => setBankName(event.target.value)}
                placeholder="Ex: Banco do Brasil"
                className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              {errors.bank_name && (
                <p className="mt-1 text-xs text-error">{errors.bank_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="bank-account-type" className="text-sm font-medium">
                Tipo (opcional)
              </label>
              <input
                id="bank-account-type"
                list={accountTypeListId}
                value={accountType ?? ""}
                onChange={(event) => setAccountType(event.target.value)}
                placeholder="Ex: Corrente"
                className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <datalist id={accountTypeListId}>
                {ACCOUNT_TYPE_SUGGESTIONS.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
              {errors.account_type && (
                <p className="mt-1 text-xs text-error">{errors.account_type}</p>
              )}
            </div>

            <div>
              <label htmlFor="bank-account-balance" className="text-sm font-medium">
                Saldo atual
              </label>
              <input
                id="bank-account-balance"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={balance}
                onChange={(event) => setBalance(event.target.value)}
                className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <p className="mt-1 text-xs text-muted">
                Sem conciliação bancária automática — atualize manualmente.
              </p>
              {errors.balance && (
                <p className="mt-1 text-xs text-error">{errors.balance}</p>
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
