import { describe, expect, test } from "vitest";
import { investmentSchema } from "./investment-schema";

describe("investmentSchema", () => {
  const validInput = {
    asset_name: "Tesouro Selic 2029",
    asset_type: "Renda Fixa",
    quantity: 10,
    average_price: 100.5,
    current_price: 105.2,
  };

  test("aceita dados válidos", () => {
    expect(investmentSchema.safeParse(validInput).success).toBe(true);
  });

  test("aceita current_price nulo (sem cotação ainda)", () => {
    const result = investmentSchema.safeParse({
      ...validInput,
      current_price: null,
    });

    expect(result.success).toBe(true);
  });

  test("aceita current_price ausente (opcional)", () => {
    const withoutCurrentPrice: Partial<typeof validInput> = { ...validInput };
    delete withoutCurrentPrice.current_price;

    expect(investmentSchema.safeParse(withoutCurrentPrice).success).toBe(true);
  });

  test("rejeita nome do ativo vazio", () => {
    const result = investmentSchema.safeParse({ ...validInput, asset_name: "" });

    expect(result.success).toBe(false);
  });

  test("rejeita tipo do ativo vazio", () => {
    const result = investmentSchema.safeParse({ ...validInput, asset_type: "" });

    expect(result.success).toBe(false);
  });

  test("rejeita quantidade zero ou negativa", () => {
    expect(
      investmentSchema.safeParse({ ...validInput, quantity: 0 }).success,
    ).toBe(false);
    expect(
      investmentSchema.safeParse({ ...validInput, quantity: -5 }).success,
    ).toBe(false);
  });

  test("rejeita preço médio zero ou negativo", () => {
    expect(
      investmentSchema.safeParse({ ...validInput, average_price: 0 }).success,
    ).toBe(false);
    expect(
      investmentSchema.safeParse({ ...validInput, average_price: -1 }).success,
    ).toBe(false);
  });

  test("rejeita preço atual negativo quando informado", () => {
    const result = investmentSchema.safeParse({
      ...validInput,
      current_price: -10,
    });

    expect(result.success).toBe(false);
  });
});
