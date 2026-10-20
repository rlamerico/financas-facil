"use client";

import { Building2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Company } from "@/hooks/use-companies";
import { REGIME_LABELS } from "@/utils/business/labels";
import { formatCnpj } from "@/utils/validation/cnpj";

interface CompanyRowProps {
  company: Company;
  isActive: boolean;
  onUse: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ICON_BUTTON_CLASS =
  "rounded-[var(--radius)] p-2 text-muted hover:bg-background hover:text-foreground";

export function CompanyRow({ company, isActive, onUse, onEdit, onDelete }: CompanyRowProps) {
  const regimeLabel = REGIME_LABELS[company.regime as keyof typeof REGIME_LABELS] ?? company.regime;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <Building2 className="h-5 w-5 shrink-0 text-muted" aria-hidden />
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {company.trade_name ?? company.legal_name}
          </p>
          <p className="truncate text-xs text-muted">
            {company.legal_name} · CNPJ {formatCnpj(company.cnpj)} · {regimeLabel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {isActive ? (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Empresa ativa
          </span>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={onUse}>
            Usar esta empresa
          </Button>
        )}
        <button type="button" className={ICON_BUTTON_CLASS} onClick={onEdit} aria-label="Editar empresa">
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" className={ICON_BUTTON_CLASS} onClick={onDelete} aria-label="Excluir empresa">
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
