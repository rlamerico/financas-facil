import { describe, expect, test } from "vitest";
import { calculateBudgetVariance } from "./budget-variance";

describe("calculateBudgetVariance", () => {
  test("retorna lista vazia para nenhuma meta", () => {
    expect(calculateBudgetVariance([], [])).toEqual([]);
  });

  test("soma o valor absoluto das transações da categoria como realizado", () => {
    const rows = calculateBudgetVariance(
      [{ categoryId: "cat-1", plannedAmount: 500 }],
      [
        { categoryId: "cat-1", amount: -120.5 },
        { categoryId: "cat-1", amount: -79.5 },
        { categoryId: "cat-2", amount: -1000 }, // outra categoria, ignorada
      ],
    );

    expect(rows).toEqual([
      { categoryId: "cat-1", planned: 500, actual: 200, variance: 300, percentage: 40 },
    ]);
  });

  test("meta sem transações no período tem realizado zero e variance = planejado", () => {
    const rows = calculateBudgetVariance(
      [{ categoryId: "cat-1", plannedAmount: 300 }],
      [],
    );

    expect(rows).toEqual([
      { categoryId: "cat-1", planned: 300, actual: 0, variance: 300, percentage: 0 },
    ]);
  });

  test("gasto estourando a meta gera variance negativo e percentual > 100", () => {
    const rows = calculateBudgetVariance(
      [{ categoryId: "cat-1", plannedAmount: 100 }],
      [{ categoryId: "cat-1", amount: -150 }],
    );

    expect(rows[0].variance).toBe(-50);
    expect(rows[0].percentage).toBe(150);
  });

  test("meta com planned_amount zero e realizado > 0 retorna percentage null", () => {
    const rows = calculateBudgetVariance(
      [{ categoryId: "cat-1", plannedAmount: 0 }],
      [{ categoryId: "cat-1", amount: -50 }],
    );

    expect(rows[0].percentage).toBeNull();
    expect(rows[0].actual).toBe(50);
    expect(rows[0].variance).toBe(-50);
  });

  test("calcula múltiplas metas de forma independente", () => {
    const rows = calculateBudgetVariance(
      [
        { categoryId: "cat-1", plannedAmount: 200 },
        { categoryId: "cat-2", plannedAmount: 400 },
      ],
      [
        { categoryId: "cat-1", amount: -200 },
        { categoryId: "cat-2", amount: -100 },
      ],
    );

    expect(rows).toEqual([
      { categoryId: "cat-1", planned: 200, actual: 200, variance: 0, percentage: 100 },
      { categoryId: "cat-2", planned: 400, actual: 100, variance: 300, percentage: 25 },
    ]);
  });

  test("ignora transações com categoryId nulo", () => {
    const rows = calculateBudgetVariance(
      [{ categoryId: "cat-1", plannedAmount: 100 }],
      [{ categoryId: null, amount: -999 }],
    );

    expect(rows[0].actual).toBe(0);
  });
});
