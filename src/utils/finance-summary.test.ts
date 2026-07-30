import { describe, expect, test } from "vitest";
import { summarizeTransactions } from "./finance-summary";

describe("summarizeTransactions", () => {
  test("retorna zeros para lista vazia", () => {
    expect(summarizeTransactions([])).toEqual({
      balance: 0,
      income: 0,
      expenses: 0,
    });
  });

  test("soma receitas e despesas separadamente e calcula o saldo", () => {
    const transactions = [
      { amount: 3000 }, // receita
      { amount: -1200.5 }, // despesa
      { amount: -300 }, // despesa
      { amount: 500 }, // receita
    ];

    const summary = summarizeTransactions(transactions);

    expect(summary.income).toBe(3500);
    expect(summary.expenses).toBe(1500.5);
    expect(summary.balance).toBeCloseTo(1999.5);
  });

  test("só despesas resulta em saldo negativo", () => {
    const summary = summarizeTransactions([
      { amount: -100 },
      { amount: -50 },
    ]);

    expect(summary).toEqual({ balance: -150, income: 0, expenses: 150 });
  });

  test("ignora campos extras do objeto de transação", () => {
    const summary = summarizeTransactions([
      { amount: 200, id: "abc", description: "Salário" },
    ]);

    expect(summary).toEqual({ balance: 200, income: 200, expenses: 0 });
  });
});
