import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface EmptyStateProps {
  title: string;
  description: string;
  /** Ação opcional (normalmente um `<Button>`) exibida abaixo do texto. */
  action?: ReactNode;
  className?: string;
}

/**
 * Estado vazio do módulo de cartões, genérico de propósito: as abas do shell
 * usam com "Em construção" e as specs seguintes reaproveitam para "nenhuma
 * fatura importada", "nenhum cartão cadastrado" etc.
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
