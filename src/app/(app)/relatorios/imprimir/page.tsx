import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { formatCurrency, formatDate } from "@/utils/format";
import { getLastMonthPeriods } from "@/utils/report-periods";
import { groupExpensesByCategory } from "@/utils/expenses-by-category";
import { aggregateMonthlyPlannedVsActual } from "@/utils/monthly-planned-actual";
import { calculateBalanceEvolution } from "@/utils/balance-evolution";

export const metadata: Metadata = {
  title: "Relatórios — Impressão",
};

const MONTHS_WINDOW = 6;

/**
 * Versão imprimível dos Relatórios: Server Component, tabelas HTML puras
 * (sem recharts — SVG de gráfico não formata bem pra impressão). Sidebar/
 * topbar/bottom bar já ficam escondidos via `print:hidden` no
 * `AppLayout` (aplicado a todas as páginas, não só esta). O usuário usa
 * "Salvar como PDF" do navegador — decisão deliberada do plano pra evitar
 * uma lib pesada de geração de PDF (puppeteer/react-pdf) só pra isso.
 */
export default async function RelatoriosImprimirPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("user_id", data.claims.sub)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const now = new Date();
  const periods = getLastMonthPeriods(now, MONTHS_WINDOW);
  const historySince = `${periods[0].year}-${String(periods[0].month).padStart(2, "0")}-01`;
  const currentPeriod = periods[periods.length - 1];

  const [{ data: categories }, { data: transactions }, { data: budgets }] =
    await Promise.all([
      supabase.from("categories").select("id, name, color"),
      supabase
        .from("transactions")
        .select("date, amount, category_id")
        .eq("profile_id", profile.id)
        .gte("date", historySince)
        .order("date", { ascending: true }),
      supabase.from("budgets").select("month, year, planned_amount").eq(
        "profile_id",
        profile.id,
      ),
    ]);

  const allTransactions = (transactions ?? []).map((transaction) => ({
    date: transaction.date,
    amount: transaction.amount,
    categoryId: transaction.category_id,
  }));

  const currentMonthTransactions = allTransactions.filter(
    (transaction) =>
      Number(transaction.date.slice(0, 4)) === currentPeriod.year &&
      Number(transaction.date.slice(5, 7)) === currentPeriod.month,
  );

  const expensesByCategory = groupExpensesByCategory(
    currentMonthTransactions,
    categories ?? [],
  );

  const budgetsByPeriod = periods.map((period) =>
    (budgets ?? [])
      .filter((budget) => budget.month === period.month && budget.year === period.year)
      .map((budget) => ({ plannedAmount: budget.planned_amount })),
  );

  const plannedVsActual = aggregateMonthlyPlannedVsActual(
    periods,
    budgetsByPeriod,
    allTransactions,
  );

  const balanceEvolution = calculateBalanceEvolution(periods, allTransactions);

  return (
    <div className="mx-auto max-w-3xl p-8 text-foreground print:p-4 print:text-black">
      <header className="mb-6 border-b border-border pb-4 print:border-black">
        <h1 className="text-2xl font-bold">Relatório financeiro</h1>
        <p className="text-sm text-muted print:text-black">
          {profile.full_name ?? "Usuário"} — gerado em {formatDate(now)}
        </p>
      </header>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">
          Despesas por categoria — {currentPeriod.label}
        </h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left print:border-black">
              <th className="py-2">Categoria</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {expensesByCategory.length === 0 && (
              <tr>
                <td className="py-2 text-muted print:text-black" colSpan={2}>
                  Nenhuma despesa no período.
                </td>
              </tr>
            )}
            {expensesByCategory.map((slice) => (
              <tr key={slice.categoryId} className="border-b border-border print:border-black">
                <td className="py-2">{slice.name}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(slice.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">
          Planejado × Realizado (últimos {MONTHS_WINDOW} meses)
        </h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left print:border-black">
              <th className="py-2">Mês</th>
              <th className="py-2 text-right">Planejado</th>
              <th className="py-2 text-right">Realizado</th>
            </tr>
          </thead>
          <tbody>
            {plannedVsActual.map((row) => (
              <tr key={row.label} className="border-b border-border print:border-black">
                <td className="py-2">{row.label}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(row.planned)}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(row.actual)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Evolução do saldo acumulado</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left print:border-black">
              <th className="py-2">Mês</th>
              <th className="py-2 text-right">Saldo acumulado</th>
            </tr>
          </thead>
          <tbody>
            {balanceEvolution.map((point) => (
              <tr key={point.label} className="border-b border-border print:border-black">
                <td className="py-2">{point.label}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(point.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
