"use client";

import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";
import type { BankAccount } from "@/hooks/use-bank-accounts";

interface BankAccountRowProps {
  account: BankAccount;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Linha da lista de contas bancárias: nome, banco, tipo e saldo. Saldo
 * negativo (conta no vermelho) é destacado em vermelho, mesmo padrão de
 * cor de ganho/perda usado em `InvestmentRow`.
 */
export function BankAccountRow({ account, onEdit, onDelete }: BankAccountRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {account.name}
        </p>
        <p className="text-xs text-muted">
          {[account.bank_name, account.account_type].filter(Boolean).join(" · ") ||
            "Sem detalhes adicionais"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            (account.balance ?? 0) < 0 ? "text-error" : "text-foreground",
          )}
        >
          {formatCurrency(account.balance ?? 0)}
        </p>

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
