"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-categories";
import { useBudgets } from "@/hooks/use-budgets";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency } from "@/utils/format";
import { MONTH_LABELS } from "@/utils/month-labels";
import { getLastMonthPeriods } from "@/utils/report-periods";
import { groupExpensesByCategory } from "@/utils/expenses-by-category";
import { aggregateMonthlyPlannedVsActual } from "@/utils/monthly-planned-actual";
import { calculateBalanceEvolution } from "@/utils/balance-evolution";
import { downloadCsv, downloadJson } from "@/utils/export";

interface ReportsViewProps {
  profileId: string;
}

/** Janela fixa dos gráficos de barras/linha — "últimos 6 meses" (PRD §2.2 módulo 6). */
const MONTHS_WINDOW = 6;
const TRANSACTIONS_PAGE_SIZE = 500;
const HISTORY_PAGE_SIZE = 1000;

/** Formatter do Tooltip do recharts: o valor chega tipado de forma ampla (`ValueType`), sempre coercionamos pra número antes de formatar como moeda. */
function currencyTooltipFormatter(value: unknown): string {
  return formatCurrency(Number(value));
}

const PIE_PALETTE = [
  "#2E7D32",
  "#1565C0",
  "#43A047",
  "#D32F2F",
  "#F9A825",
  "#6A1B9A",
  "#00838F",
  "#5F6368",
];

/**
 * Client Component: 3 gráficos recharts (pizza de despesas por categoria,
 * barras Planejado × Realizado, linha de evolução de saldo) + export
 * CSV/JSON. Regra de ouro: só `profileId` (string) atravessa a fronteira
 * Server → Client — os arrays de dados dos gráficos são montados aqui, do
 * lado client, a partir dos hooks já existentes (não são passados prontos
 * pelo Server Component).
 */
export function ReportsView({ profileId }: ReportsViewProps) {
  const now = useMemo(() => new Date(), []);
  const [pieMonth, setPieMonth] = useState(now.getMonth() + 1);
  const [pieYear, setPieYear] = useState(now.getFullYear());

  const { data: categories } = useCategories();

  const pieFilters = useMemo(
    () => ({ month: pieMonth, year: pieYear }),
    [pieMonth, pieYear],
  );
  const {
    data: pieTransactionsData,
    isLoading: isLoadingPie,
    isError: isErrorPie,
  } = useTransactions(profileId, pieFilters, TRANSACTIONS_PAGE_SIZE);

  const periods = useMemo(
    () => getLastMonthPeriods(now, MONTHS_WINDOW),
    [now],
  );
  const historySince = `${periods[0].year}-${String(periods[0].month).padStart(2, "0")}-01`;
  const historyFilters = useMemo(
    () => ({ sinceDate: historySince }),
    [historySince],
  );
  const {
    data: historyTransactionsData,
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
  } = useTransactions(profileId, historyFilters, HISTORY_PAGE_SIZE);

  // Número fixo de meses na janela (MONTHS_WINDOW = 6): chamar o hook uma
  // vez por período é seguro pras Regras de Hooks (contagem sempre igual,
  // ordem sempre igual) — `useBudgets` não suporta filtro por intervalo de
  // meses, só reusa o que já existe.
  const budgets0 = useBudgets(profileId, periods[0].month, periods[0].year);
  const budgets1 = useBudgets(profileId, periods[1].month, periods[1].year);
  const budgets2 = useBudgets(profileId, periods[2].month, periods[2].year);
  const budgets3 = useBudgets(profileId, periods[3].month, periods[3].year);
  const budgets4 = useBudgets(profileId, periods[4].month, periods[4].year);
  const budgets5 = useBudgets(profileId, periods[5].month, periods[5].year);
  const budgetsQueries = [
    budgets0,
    budgets1,
    budgets2,
    budgets3,
    budgets4,
    budgets5,
  ];

  const isLoadingBudgets = budgetsQueries.some((query) => query.isLoading);
  const isErrorBudgets = budgetsQueries.some((query) => query.isError);

  const pieData = useMemo(() => {
    const transactions = (pieTransactionsData?.pages.flat() ?? []).map(
      (transaction) => ({
        categoryId: transaction.category_id,
        amount: transaction.amount,
      }),
    );
    return groupExpensesByCategory(transactions, categories ?? []);
  }, [pieTransactionsData, categories]);

  const historyTransactions = useMemo(
    () =>
      (historyTransactionsData?.pages.flat() ?? []).map((transaction) => ({
        date: transaction.date,
        amount: transaction.amount,
      })),
    [historyTransactionsData],
  );

  const budgetsData = useMemo(
    () => [
      budgets0.data ?? [],
      budgets1.data ?? [],
      budgets2.data ?? [],
      budgets3.data ?? [],
      budgets4.data ?? [],
      budgets5.data ?? [],
    ],
    [
      budgets0.data,
      budgets1.data,
      budgets2.data,
      budgets3.data,
      budgets4.data,
      budgets5.data,
    ],
  );

  const barData = useMemo(() => {
    const budgetsByPeriod = budgetsData.map((budgets) =>
      budgets.map((budget) => ({ plannedAmount: budget.planned_amount })),
    );
    return aggregateMonthlyPlannedVsActual(
      periods,
      budgetsByPeriod,
      historyTransactions,
    );
  }, [periods, historyTransactions, budgetsData]);

  const lineData = useMemo(
    () => calculateBalanceEvolution(periods, historyTransactions),
    [periods, historyTransactions],
  );

  const totalExpenses = pieData.reduce((sum, slice) => sum + slice.total, 0);

  const isLoading = isLoadingPie || isLoadingHistory || isLoadingBudgets;
  const isError = isErrorPie || isErrorHistory || isErrorBudgets;

  const handleExportCsv = () => {
    downloadCsv(
      `despesas-por-categoria-${pieYear}-${String(pieMonth).padStart(2, "0")}.csv`,
      pieData.map((slice) => ({ categoria: slice.name, total: slice.total })),
    );
  };

  const handleExportJson = () => {
    downloadJson(
      `despesas-por-categoria-${pieYear}-${String(pieMonth).padStart(2, "0")}.json`,
      pieData.map((slice) => ({ categoria: slice.name, total: slice.total })),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleExportCsv}>
            Exportar CSV
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleExportJson}>
            Exportar JSON
          </Button>
        </div>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/relatorios/imprimir">
            <Printer className="h-4 w-4" aria-hidden />
            Versão para impressão
          </Link>
        </Button>
      </div>

      {isError && (
        <p className="rounded-[var(--radius)] border border-error/30 bg-error/5 p-4 text-sm text-error">
          Não foi possível carregar os dados dos relatórios.
        </p>
      )}

      <section className="rounded-lg border border-border bg-surface shadow-card p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Despesas por categoria
            </h2>
            <p className="text-sm text-muted">
              Total do período: {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-muted">Mês</span>
              <select
                value={pieMonth}
                onChange={(event) => setPieMonth(Number(event.target.value))}
                className="rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm"
              >
                {MONTH_LABELS.map((label, index) => (
                  <option key={label} value={index + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-muted">Ano</span>
              <input
                type="number"
                value={pieYear}
                onChange={(event) => setPieYear(Number(event.target.value))}
                className="w-24 rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>

        <div className="mt-4 h-[300px]">
          {!isLoadingPie && pieData.length === 0 && (
            <p className="flex h-full items-center justify-center text-sm text-muted">
              Nenhuma despesa no período selecionado.
            </p>
          )}
          {pieData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="total"
                  nameKey="name"
                  outerRadius={100}
                  label={(entry: { name?: string; percent?: number }) =>
                    `${entry.name ?? ""} (${((entry.percent ?? 0) * 100).toFixed(0)}%)`
                  }
                >
                  {pieData.map((slice, index) => (
                    <Cell
                      key={slice.categoryId}
                      fill={slice.color ?? PIE_PALETTE[index % PIE_PALETTE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={currencyTooltipFormatter} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface shadow-card p-4">
        <h2 className="text-lg font-semibold text-foreground">
          Planejado × Realizado (últimos {MONTHS_WINDOW} meses)
        </h2>
        <div className="mt-4 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={currencyTooltipFormatter} />
              <Legend />
              <Bar dataKey="planned" name="Planejado" fill="#1565C0" />
              <Bar dataKey="actual" name="Realizado" fill="#2E7D32" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface shadow-card p-4">
        <h2 className="text-lg font-semibold text-foreground">
          Evolução do saldo acumulado
        </h2>
        <div className="mt-4 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={currencyTooltipFormatter} />
              <Line
                type="monotone"
                dataKey="balance"
                name="Saldo acumulado"
                stroke="#2E7D32"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {isLoading && (
        <p className="text-center text-sm text-muted">Carregando relatórios...</p>
      )}
    </div>
  );
}
