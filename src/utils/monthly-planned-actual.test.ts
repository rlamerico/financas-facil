import { describe, expect, test } from "vitest";
import { aggregateMonthlyPlannedVsActual } from "./monthly-planned-actual";
import type { ReportPeriod } from "./report-periods";

const periods: ReportPeriod[] = [
  { month: 5, year: 2026, label: "Mai/2026" },
  { month: 6, year: 2026, label: "Jun/2026" },
];

describe("aggregateMonthlyPlannedVsActual", () => {
  test("soma planejado do período correspondente e realizado das transações do mês", () => {
    const rows = aggregateMonthlyPlannedVsActual(
      periods,
      [
        [{ plannedAmount: 500 }, { plannedAmount: 300 }],
        [{ plannedAmount: 400 }],
      ],
      [
        { date: "2026-05-10", amount: -200 },
        { date: "2026-05-15", amount: -100 },
        { date: "2026-06-01", amount: -50 },
        { date: "2026-06-02", amount: 1000 }, // receita, ignorada no realizado
      ],
    );

    expect(rows).toEqual([
      { label: "Mai/2026", planned: 800, actual: 300 },
      { label: "Jun/2026", planned: 400, actual: 50 },
    ]);
  });

  test("período sem metas nem transações fica zerado", () => {
    const rows = aggregateMonthlyPlannedVsActual(periods, [[], []], []);
    expect(rows).toEqual([
      { label: "Mai/2026", planned: 0, actual: 0 },
      { label: "Jun/2026", planned: 0, actual: 0 },
    ]);
  });

  test("trata planned_amount nulo como zero", () => {
    const rows = aggregateMonthlyPlannedVsActual(
      [periods[0]],
      [[{ plannedAmount: null }]],
      [],
    );
    expect(rows[0].planned).toBe(0);
  });

  test("ignora transações de outros meses", () => {
    const rows = aggregateMonthlyPlannedVsActual(
      [periods[0]],
      [[]],
      [{ date: "2026-06-01", amount: -999 }],
    );
    expect(rows[0].actual).toBe(0);
  });
});
