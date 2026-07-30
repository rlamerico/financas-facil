import { describe, expect, test } from "vitest";
import { getLastMonthPeriods } from "./report-periods";

describe("getLastMonthPeriods", () => {
  test("retorna os últimos 6 meses em ordem cronológica, terminando no mês de referência", () => {
    const periods = getLastMonthPeriods(new Date("2026-06-15"), 6);

    expect(periods).toEqual([
      { month: 1, year: 2026, label: "Jan/2026" },
      { month: 2, year: 2026, label: "Fev/2026" },
      { month: 3, year: 2026, label: "Mar/2026" },
      { month: 4, year: 2026, label: "Abr/2026" },
      { month: 5, year: 2026, label: "Mai/2026" },
      { month: 6, year: 2026, label: "Jun/2026" },
    ]);
  });

  test("atravessa a virada de ano corretamente", () => {
    const periods = getLastMonthPeriods(new Date("2026-02-10"), 6);

    expect(periods).toEqual([
      { month: 9, year: 2025, label: "Set/2025" },
      { month: 10, year: 2025, label: "Out/2025" },
      { month: 11, year: 2025, label: "Nov/2025" },
      { month: 12, year: 2025, label: "Dez/2025" },
      { month: 1, year: 2026, label: "Jan/2026" },
      { month: 2, year: 2026, label: "Fev/2026" },
    ]);
  });

  test("count = 1 retorna só o mês de referência", () => {
    const periods = getLastMonthPeriods(new Date("2026-06-15"), 1);
    expect(periods).toEqual([{ month: 6, year: 2026, label: "Jun/2026" }]);
  });
});
