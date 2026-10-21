"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { BusinessReceipt } from "@/hooks/use-business-receipts";
import { formatRate, formatUsd } from "@/utils/business/money-format";
import { formatCurrency } from "@/utils/format";

interface ReceiptRowProps {
  receipt: BusinessReceipt;
  clientName: string;
  onEdit: () => void;
  onDelete: () => void;
}

const ICON_BUTTON_CLASS =
  "rounded-[var(--radius)] p-2 text-muted hover:bg-background hover:text-foreground";

function formatIsoAsBr(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");

  return `${day}/${month}/${year}`;
}

function AmountLabel({ receipt }: { receipt: BusinessReceipt }) {
  if (receipt.currency !== "USD") {
    return <span className="tabular-nums">{formatCurrency(receipt.amount_brl)}</span>;
  }

  return (
    <span className="tabular-nums">
      {formatUsd(receipt.amount_original)}
      {receipt.exchange_rate !== null && (
        <span className="block text-xs text-muted">
          a {formatRate(receipt.exchange_rate)} = {formatCurrency(receipt.amount_brl)}
        </span>
      )}
    </span>
  );
}

export function ReceiptRow({ receipt, clientName, onEdit, onDelete }: ReceiptRowProps) {
  const isExpected = receipt.status === "expected";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{clientName}</p>
        <p className="text-xs text-muted">
          {formatIsoAsBr(receipt.received_on)}
          {receipt.invoice_ref ? ` · NF ${receipt.invoice_ref}` : ""}
          {isExpected ? " · previsto" : ""}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-right text-sm font-semibold text-foreground">
          <AmountLabel receipt={receipt} />
        </div>
        <button type="button" className={ICON_BUTTON_CLASS} onClick={onEdit} aria-label="Editar recebimento">
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" className={ICON_BUTTON_CLASS} onClick={onDelete} aria-label="Excluir recebimento">
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
