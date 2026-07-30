"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";
import {
  useBankAccounts,
  useDeleteBankAccount,
  type BankAccount,
} from "@/hooks/use-bank-accounts";
import { BankAccountForm } from "./bank-account-form";
import { BankAccountRow } from "./bank-account-row";

interface BankAccountsViewProps {
  profileId: string;
}

type FormState = { mode: "create" } | { mode: "edit"; account: BankAccount };

/**
 * Client Component: CRUD de contas bancárias + saldo total consolidado.
 * A regra de ouro se aplica aqui também — só `profileId` (string) atravessa
 * a fronteira Server → Client, mesmo padrão de `InvestmentsView`.
 */
export function BankAccountsView({ profileId }: BankAccountsViewProps) {
  const { data: accounts, isLoading, isError } = useBankAccounts(profileId);
  const deleteBankAccount = useDeleteBankAccount(profileId);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const totalBalance = useMemo(
    () => (accounts ?? []).reduce((sum, account) => sum + (account.balance ?? 0), 0),
    [accounts],
  );

  const handleDelete = async (account: BankAccount) => {
    const confirmed = window.confirm(`Excluir a conta "${account.name}"?`);
    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    try {
      await deleteBankAccount.mutateAsync(account.id);
    } catch {
      setDeleteError("Não foi possível excluir a conta bancária.");
    }
  };

  return (
    <div>
      <div className="rounded-lg border border-border bg-surface shadow-card p-4 sm:max-w-xs">
        <p className="text-xs font-medium text-muted">Saldo total</p>
        <p
          className={cn(
            "mt-1 text-xl font-bold tabular-nums",
            totalBalance < 0 ? "text-error" : "text-foreground",
          )}
        >
          {formatCurrency(totalBalance)}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Contas</h2>
        <Button type="button" onClick={() => setFormState({ mode: "create" })}>
          <Plus className="h-4 w-4" aria-hidden />
          Nova conta
        </Button>
      </div>

      {deleteError && <p className="mt-2 text-sm text-error">{deleteError}</p>}

      <div className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface shadow-card">
        {isLoading && (
          <p className="p-4 text-sm text-muted">Carregando contas...</p>
        )}
        {isError && (
          <p className="p-4 text-sm text-error">
            Não foi possível carregar as contas bancárias.
          </p>
        )}
        {!isLoading && !isError && (accounts ?? []).length === 0 && (
          <p className="p-4 text-sm text-muted">Nenhuma conta bancária cadastrada.</p>
        )}
        {(accounts ?? []).map((account) => (
          <BankAccountRow
            key={account.id}
            account={account}
            onEdit={() => setFormState({ mode: "edit", account })}
            onDelete={() => handleDelete(account)}
          />
        ))}
      </div>

      {formState && (
        <BankAccountForm
          profileId={profileId}
          account={formState.mode === "edit" ? formState.account : null}
          onClose={() => setFormState(null)}
        />
      )}
    </div>
  );
}
