"use client";

import { useRef } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Sparkline } from "@/components/ui/sparkline";

const SPARKLINE_DEMO = [4, 6, 5, 9, 8, 12, 11, 15, 14, 18, 17, 21];

const ROWS_DEMO = [
  { label: "Salário", value: "+R$ 8.500,00", isIncome: true },
  { label: "Supermercado", value: "-R$ 642,30", isIncome: false },
  { label: "Aporte CDB", value: "-R$ 1.000,00", isIncome: false },
] as const;

const MAX_TILT_X_DEG = 5;
const MAX_TILT_Y_DEG = 8;

/**
 * Prévia estilizada do Dashboard em perspectiva 3D (CSS puro, sem three.js).
 * O tilt segue o ponteiro com amplitude baixa e volta ao repouso ao sair;
 * com `prefers-reduced-motion` o cartão fica na pose estática.
 */
export function HeroMockup() {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card || event.pointerType !== "mouse") {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const ratioX = (event.clientX - rect.left) / rect.width - 0.5;
    const ratioY = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty(
      "--tilt-x",
      `${(-ratioY * MAX_TILT_X_DEG * 2).toFixed(2)}deg`,
    );
    card.style.setProperty(
      "--tilt-y",
      `${(ratioX * MAX_TILT_Y_DEG * 2).toFixed(2)}deg`,
    );
  };

  const handlePointerLeave = () => {
    const card = cardRef.current;
    if (!card) {
      return;
    }
    card.style.removeProperty("--tilt-x");
    card.style.removeProperty("--tilt-y");
  };

  return (
    <div
      className="[perspective:1200px]"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-hidden
    >
      <div
        ref={cardRef}
        className="transform-gpu rounded-xl border border-border bg-surface p-4 shadow-overlay transition-transform duration-300 ease-out [transform:rotateX(var(--tilt-x,4deg))_rotateY(var(--tilt-y,-8deg))] motion-reduce:[transform:none]"
      >
        {/* Barra de janela */}
        <div className="mb-4 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-error/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </div>

        {/* Mini hero card de saldo */}
        <div className="rounded-lg bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 p-4 text-white shadow-hero">
          <p className="text-[10px] font-medium uppercase tracking-wide text-white/70">
            Saldo do mês
          </p>
          <div className="mt-1 flex items-end justify-between gap-4">
            <p className="text-2xl font-bold tabular-nums">R$ 12.480,00</p>
            <div className="text-white/90">
              <Sparkline
                values={SPARKLINE_DEMO}
                width={120}
                height={36}
                showArea
              />
            </div>
          </div>
        </div>

        {/* Mini stat chips */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-surface-raised p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
              Receitas
            </p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-success">
              R$ 9.720,00
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-raised p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
              Despesas
            </p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-error">
              R$ 4.310,00
            </p>
          </div>
        </div>

        {/* Mini lista de transações */}
        <div className="mt-3 divide-y divide-border rounded-lg border border-border">
          {ROWS_DEMO.map((row) => (
            <div key={row.label} className="flex items-center gap-2.5 p-2.5">
              <span
                className={
                  row.isIncome
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-success"
                    : "flex h-6 w-6 items-center justify-center rounded-full bg-error/10 text-error"
                }
              >
                {row.isIncome ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
              </span>
              <span className="flex-1 text-xs font-medium text-foreground">
                {row.label}
              </span>
              <span
                className={
                  row.isIncome
                    ? "text-xs font-semibold tabular-nums text-success"
                    : "text-xs font-semibold tabular-nums text-error"
                }
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
