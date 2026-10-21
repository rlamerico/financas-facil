"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { BusinessClient } from "@/hooks/use-business-clients";
import { CURRENCY_SYMBOLS } from "@/utils/business/labels";
import { formatCnpj } from "@/utils/validation/cnpj";

interface ClientRowProps {
  client: BusinessClient;
  onEdit: () => void;
  onDelete: () => void;
}

const ICON_BUTTON_CLASS =
  "rounded-[var(--radius)] p-2 text-muted hover:bg-background hover:text-foreground";

function formatDocument(client: BusinessClient): string | null {
  if (!client.document) {
    return null;
  }

  return client.origin === "domestic" ? formatCnpj(client.document) : client.document;
}

export function ClientRow({ client, onEdit, onDelete }: ClientRowProps) {
  const currencySymbol =
    CURRENCY_SYMBOLS[client.default_currency as keyof typeof CURRENCY_SYMBOLS] ??
    client.default_currency;
  const details = [formatDocument(client), client.country].filter(Boolean).join(" · ");

  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{client.name}</p>
        {details && <p className="truncate text-xs text-muted">{details}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
          {currencySymbol}
        </span>
        <button type="button" className={ICON_BUTTON_CLASS} onClick={onEdit} aria-label="Editar cliente">
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" className={ICON_BUTTON_CLASS} onClick={onDelete} aria-label="Excluir cliente">
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
