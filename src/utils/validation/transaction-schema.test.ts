import { describe, expect, test } from "vitest";
import { toSignedAmount, transactionSchema } from "./transaction-schema";

describe("transactionSchema", () => {
  const validInput = {
    description: "Mercado",
    amount: 150.5,
    date: "2026-06-15",
    category_id: "11111111-1111-1111-1111-111111111111",
    type: "expense" as const,
  };

  test("aceita dados válidos", () => {
    const result = transactionSchema.safeParse(validInput);

    expect(result.success).toBe(true);
  });

  test("aceita category_id nulo (transação sem categoria)", () => {
    const result = transactionSchema.safeParse({
      ...validInput,
      category_id: null,
    });

    expect(result.success).toBe(true);
  });

  test("rejeita descrição vazia", () => {
    const result = transactionSchema.safeParse({
      ...validInput,
      description: "",
    });

    expect(result.success).toBe(false);
  });

  test("rejeita valor zero ou negativo", () => {
    expect(transactionSchema.safeParse({ ...validInput, amount: 0 }).success).toBe(
      false,
    );
    expect(
      transactionSchema.safeParse({ ...validInput, amount: -10 }).success,
    ).toBe(false);
  });

  test("rejeita data vazia", () => {
    const result = transactionSchema.safeParse({ ...validInput, date: "" });

    expect(result.success).toBe(false);
  });

  test("rejeita tipo inválido", () => {
    const result = transactionSchema.safeParse({
      ...validInput,
      type: "transfer",
    });

    expect(result.success).toBe(false);
  });
});

describe("toSignedAmount", () => {
  test("retorna valor negativo para despesa", () => {
    expect(toSignedAmount({ amount: 100, type: "expense" })).toBe(-100);
  });

  test("retorna valor positivo para receita", () => {
    expect(toSignedAmount({ amount: 100, type: "income" })).toBe(100);
  });

  test("normaliza valores já negativos pelo tipo informado", () => {
    expect(toSignedAmount({ amount: -50, type: "income" })).toBe(50);
    expect(toSignedAmount({ amount: -50, type: "expense" })).toBe(-50);
  });
});
