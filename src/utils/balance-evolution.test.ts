import { describe, expect, test } from "vitest";
import { calculateBalanceEvolution } from "./balance-evolution";
import type { ReportPeriod } from "./report-periods";

const periods: ReportPeriod[] = [
  { month: 5, year: 2026, label: "Mai/2026" },
  { month: 6, year: 2026, label: "Jun/2026" },
];

describe("calculateBalanceEvolution", () => {
  test("acumula o saldo mês a mês", () => {
    const points = calculateBalanceEvolution(periods, [
      { date: "2026-05-05", amount: 1000 },
      { date: "2026-05-10", amount: -400 },
      { date: "2026-06-01", amount: -200 },
    ]);

    expect(points).toEqual([
      { label: "Mai/2026", balance: 600 },
      { label: "Jun/2026", balance: 400 },
    ]);
  });

  test("sem transações mantém saldo zerado em todos os pontos", () => {
    expect(calculateBalanceEvolution(periods, [])).toEqual([
      { label: "Mai/2026", balance: 0 },
      { label: "Jun/2026", balance: 0 },
    ]);
  });

  test("saldo pode ficar negativo", () => {
    const points = calculateBalanceEvolution([periods[0]], [
      { date: "2026-05-05", amount: -500 },
    ]);
    expect(points[0].balance).toBe(-500);
  });
});
