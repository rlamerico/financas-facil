import { describe, expect, test } from "vitest";
import { comparePeriods } from "./period-comparison";

const transaction = (date: string, amount: number) => ({ date, amount });

describe("comparePeriods", () => {
  test("separa transações em período atual (>= corte) e anterior", () => {
    const result = comparePeriods(
      [
        transaction("2026-06-01", 100),
        transaction("2026-06-14", -40),
        transaction("2026-06-15", 200),
        transaction("2026-06-30", -50),
      ],
      "2026-06-15",
    );

    expect(result.current).toEqual({ balance: 150, income: 200, expenses: 50 });
    expect(result.previous).toEqual({ balance: 60, income: 100, expenses: 40 });
  });

  test("calcula variação percentual de receitas e despesas", () => {
    const result = comparePeriods(
      [
        transaction("2026-06-01", 100),
        transaction("2026-06-01", -100),
        transaction("2026-06-15", 150),
        transaction("2026-06-15", -80),
      ],
      "2026-06-15",
    );

    expect(result.incomeDeltaPct).toBeCloseTo(50);
    expect(result.expensesDeltaPct).toBeCloseTo(-20);
  });

  test("variação é null quando o período anterior é zero", () => {
    const result = comparePeriods([transaction("2026-06-20", 100)], "2026-06-15");

    expect(result.incomeDeltaPct).toBeNull();
    expect(result.expensesDeltaPct).toBeNull();
    expect(result.balanceDeltaPct).toBeNull();
  });

  test("saldo negativo no período anterior usa valor absoluto como base", () => {
    const result = comparePeriods(
      [transaction("2026-06-01", -100), transaction("2026-06-20", 50)],
      "2026-06-15",
    );

    // saldo: -100 → 50 = melhora de 150 sobre base 100 = +150%
    expect(result.balanceDeltaPct).toBeCloseTo(150);
  });

  test("lista vazia produz resumos zerados e deltas null", () => {
    const result = comparePeriods([], "2026-06-15");

    expect(result.current).toEqual({ balance: 0, income: 0, expenses: 0 });
    expect(result.previous).toEqual({ balance: 0, income: 0, expenses: 0 });
    expect(result.incomeDeltaPct).toBeNull();
  });
});
