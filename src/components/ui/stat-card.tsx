import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";

type StatTone = "neutral" | "income" | "expense";

const ICON_TONES: Record<StatTone, string> = {
  neutral: "bg-secondary/10 text-secondary",
  income: "bg-success/10 text-success",
  expense: "bg-error/10 text-error",
};

const VALUE_TONES: Record<StatTone, string> = {
  neutral: "text-foreground",
  income: "text-success",
  expense: "text-error",
};

export interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: StatTone;
  /** Variação % vs período anterior; null = sem base de comparação. */
  deltaPct?: number | null;
  /** Em despesas, subir é ruim — inverte a semântica de cor do delta. */
  invertDelta?: boolean;
  className?: string;
}

function formatDeltaPct(deltaPct: number): string {
  const formatted = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(Math.abs(deltaPct));
  return `${deltaPct >= 0 ? "+" : "-"}${formatted}%`;
}

/** Card de indicador do Dashboard: ícone, valor e chip de variação. */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  deltaPct,
  invertDelta = false,
  className,
}: StatCardProps) {
  const hasDelta = deltaPct !== null && deltaPct !== undefined;
  const isImprovement = hasDelta && (invertDelta ? deltaPct < 0 : deltaPct >= 0);

  return (
    <Card variant="elevated" className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 truncate text-2xl font-bold tabular-nums",
              VALUE_TONES[tone],
            )}
          >
            {formatCurrency(value)}
          </p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            ICON_TONES[tone],
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>

      {hasDelta ? (
        <p
          className={cn(
            "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
            isImprovement
              ? "bg-success/10 text-success"
              : "bg-error/10 text-error",
          )}
        >
          {deltaPct >= 0 ? (
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
          )}
          {formatDeltaPct(deltaPct)}
          <span className="font-normal text-muted">vs 30d anteriores</span>
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted">Sem base de comparação</p>
      )}
    </Card>
  );
}
