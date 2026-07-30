import { describe, expect, test } from "vitest";
import { budgetSchema } from "./budget-schema";

describe("budgetSchema", () => {
  const validInput = {
    category_id: "11111111-1111-1111-1111-111111111111",
    month: 6,
    year: 2026,
    planned_amount: 500,
  };

  test("aceita dados válidos", () => {
    expect(budgetSchema.safeParse(validInput).success).toBe(true);
  });

  test("aceita valor planejado zero", () => {
    const result = budgetSchema.safeParse({ ...validInput, planned_amount: 0 });

    expect(result.success).toBe(true);
  });

  test("rejeita valor planejado negativo", () => {
    const result = budgetSchema.safeParse({
      ...validInput,
      planned_amount: -10,
    });

    expect(result.success).toBe(false);
  });

  test("rejeita categoria vazia", () => {
    const result = budgetSchema.safeParse({ ...validInput, category_id: "" });

    expect(result.success).toBe(false);
  });

  test("rejeita mês fora do intervalo 1-12", () => {
    expect(budgetSchema.safeParse({ ...validInput, month: 0 }).success).toBe(
      false,
    );
    expect(budgetSchema.safeParse({ ...validInput, month: 13 }).success).toBe(
      false,
    );
  });

  test("rejeita ano fora do intervalo suportado", () => {
    expect(budgetSchema.safeParse({ ...validInput, year: 1999 }).success).toBe(
      false,
    );
  });
});
