import { describe, expect, test } from "vitest";
import { recalculateFx, type FxValues } from "./fx-fields";

const BASE: FxValues = { usd: 1000, rate: 5.4321, brl: 5432.1 };

describe("recalculateFx", () => {
  test("ao editar a cotação, recalcula o valor em BRL", () => {
    const result = recalculateFx({ ...BASE, rate: 5.5 }, "rate");

    expect(result.brl).toBe(5500);
  });

  test("ao editar o BRL recebido, recalcula a cotação efetiva", () => {
    const result = recalculateFx({ ...BASE, brl: 5500 }, "brl");

    expect(result.rate).toBe(5.5);
  });

  test("ao editar o USD com cotação preenchida, recalcula o BRL", () => {
    const result = recalculateFx({ ...BASE, usd: 2000 }, "usd");

    expect(result.brl).toBe(10864.2);
  });

  test("ao editar o USD sem cotação mas com BRL, recalcula a cotação", () => {
    const result = recalculateFx({ usd: 1000, rate: null, brl: 5500 }, "usd");

    expect(result.rate).toBe(5.5);
  });

  test("não calcula enquanto o USD estiver vazio", () => {
    const result = recalculateFx({ usd: null, rate: 5.4, brl: null }, "rate");

    expect(result).toEqual({ usd: null, rate: 5.4, brl: null });
  });

  test("não altera o objeto de entrada", () => {
    const input: FxValues = { ...BASE, rate: 5.5 };

    recalculateFx(input, "rate");

    expect(input.brl).toBe(5432.1);
  });
});
