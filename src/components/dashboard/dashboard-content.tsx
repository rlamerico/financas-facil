"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { comparePeriods } from "@/utils/period-comparison";
import { formatCurrency, formatDate } from "@/utils/format";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Sparkline } from "@/components/ui/sparkline";
import { cn } from "@/utils/cn";

interface DashboardContentProps {
  profileId: string;
}

const DASHBOARD_WINDOW_DAYS = 30;
const RECENT_TRANSACTIONS_LIMIT = 5;
/** Busca 2 janelas (60 dias) pra comparar o período atual com o anterior. */
const FETCH_WINDOW_DAYS = DASHBOARD_WINDOW_DAYS * 2;
/** Página maior que o padrão de 20: o Dashboard precisa do total do período
 *  pra somar corretamente, não só da primeira leva. */
const DASHBOARD_PAGE_SIZE = 400;

function daysAgoIsoDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

/**
 * Client Component: hero card de Saldo (assinatura visual do produto),
 * stat cards de Receitas/Despesas com variação vs 30 dias anteriores e as
 * 5 transações mais recentes. Usa `useTransactions` (já assina Realtime).
 */
export function DashboardContent({ profileId }: DashboardContentProps) {
  const filters = useMemo(
    () => ({ sinceDate: daysAgoIsoDate(FETCH_WINDOW_DAYS) }),
    [],
  );
  const { data, isLoading, isError } = useTransactions(
    profileId,
    filters,
    DASHBOARD_PAGE_SIZE,
  );

  const transactions = useMemo(() => data?.pages.flat() ?? [], [data]);

  const boundary = useMemo(() => daysAgoIsoDate(DASHBOARD_WINDOW_DAYS), []);
  const comparison = useMemo(
    () => comparePeriods(transactions, boundary),
    [transactions, boundary],
  );

  const sparklineValues = useMemo(() => {
    const currentWindow = transactions.filter(
      (transaction) => transaction.date >= boundary,
    );
    const chronological = [...currentWindow].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return chronological.reduce<number[]>(
      (cumulative, transaction) => [
        ...cumulative,
        (cumulative.at(-1) ?? 0) + transaction.amount,
      ],
      [],
    );
  }, [transactions, boundary]);

  // `transactions` já vem ordenada por data desc na query.
  const recent = transactions.slice(0, RECENT_TRANSACTIONS_LIMIT);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <p className="text-sm text-error">
        Não foi possível carregar os dados do Dashboard.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero card — assinatura visual: saldo sobre gradiente da marca */}
      <Card
        variant="hero"
        className="animate-fade-up grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-end sm:p-8"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-white/70">
            Saldo dos últimos {DASHBOARD_WINDOW_DAYS} dias
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums text-white sm:text-5xl">
            {formatCurrency(comparison.current.balance)}
          </p>
          {comparison.balanceDeltaPct !== null && (
            <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
              {comparison.balanceDeltaPct >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
              )}
              {new Intl.NumberFormat("pt-BR", {
                maximumFractionDigits: 1,
                signDisplay: "always",
              }).format(comparison.balanceDeltaPct)}
              % vs {DASHBOARD_WINDOW_DAYS} dias anteriores
            </p>
          )}
        </div>

        {sparklineValues.length > 1 && (
          <div className="text-white/90">
            <Sparkline
              values={sparklineValues}
              width={280}
              height={72}
              showArea
              className="h-18 w-full sm:w-70"
            />
          </div>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Receitas"
          value={comparison.current.income}
          icon={TrendingUp}
          tone="income"
          deltaPct={comparison.incomeDeltaPct}
          className="animate-fade-up [animation-delay:80ms]"
        />
        <StatCard
          label="Despesas"
          value={comparison.current.expenses}
          icon={TrendingDown}
          tone="expense"
          deltaPct={comparison.expensesDeltaPct}
          invertDelta
          className="animate-fade-up [animation-delay:160ms]"
        />
      </div>

      <Card className="animate-fade-up [animation-delay:240ms]">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-sm font-semibold text-foreground">
            Transações recentes
          </h2>
          <Link
            href="/transacoes"
            className="text-xs font-medium text-secondary hover:underline"
          >
            Ver todas
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="p-4 text-sm text-muted">
            Nenhuma transação nos últimos {FETCH_WINDOW_DAYS} dias.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((transaction) => {
              const isIncome = transaction.amount >= 0;
              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-background/60"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      isIncome
                        ? "bg-success/10 text-success"
                        : "bg-error/10 text-error",
                    )}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="h-4 w-4" aria-hidden />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      isIncome ? "text-success" : "text-error",
                    )}
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

/** Placeholder com a mesma silhueta do conteúdo pra evitar layout shift. */
function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando dashboard">
      <div className="h-40 animate-pulse rounded-lg bg-border/60" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-32 animate-pulse rounded-lg bg-border/60" />
        <div className="h-32 animate-pulse rounded-lg bg-border/60" />
      </div>
      <div className="h-72 animate-pulse rounded-lg bg-border/60" />
    </div>
  );
}
