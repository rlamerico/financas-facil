import { describe, expect, test } from "vitest";
import { groupExpensesByCategory } from "./expenses-by-category";

describe("groupExpensesByCategory", () => {
  const categories = [
    { id: "cat-1", name: "Mercado", color: "#43A047" },
    { id: "cat-2", name: "Transporte", color: "#1565C0" },
  ];

  test("retorna lista vazia sem transações", () => {
    expect(groupExpensesByCategory([], categories)).toEqual([]);
  });

  test("soma despesas por categoria e ignora receitas", () => {
    const slices = groupExpensesByCategory(
      [
        { categoryId: "cat-1", amount: -100 },
        { categoryId: "cat-1", amount: -50 },
        { categoryId: "cat-2", amount: -30 },
        { categoryId: "cat-1", amount: 5000 }, // receita, ignorada
      ],
      categories,
    );

    expect(slices).toEqual([
      { categoryId: "cat-1", name: "Mercado", total: 150, color: "#43A047" },
      { categoryId: "cat-2", name: "Transporte", total: 30, color: "#1565C0" },
    ]);
  });

  test("agrupa transações sem categoria em 'Sem categoria'", () => {
    const slices = groupExpensesByCategory(
      [{ categoryId: null, amount: -80 }],
      categories,
    );

    expect(slices).toEqual([
      { categoryId: "uncategorized", name: "Sem categoria", total: 80, color: null },
    ]);
  });

  test("ordena do maior pro menor gasto", () => {
    const slices = groupExpensesByCategory(
      [
        { categoryId: "cat-2", amount: -10 },
        { categoryId: "cat-1", amount: -500 },
      ],
      categories,
    );

    expect(slices.map((slice) => slice.categoryId)).toEqual(["cat-1", "cat-2"]);
  });

  test("categoria não encontrada no mapa cai em 'Sem categoria'", () => {
    const slices = groupExpensesByCategory(
      [{ categoryId: "cat-desconhecida", amount: -20 }],
      categories,
    );

    expect(slices[0].name).toBe("Sem categoria");
  });
});
