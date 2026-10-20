import { describe, expect, test } from "vitest";
import {
  convertToBrl,
  impliedRate,
  rateDeviation,
  round2,
} from "./convert-currency";

describe("round2", () => {
  test("arredonda para centavos", () => {
    expect(round2(5432.1234)).toBe(5432.12);
  });

  test("arredonda meio para cima mesmo com erro de ponto flutuante", () => {
    expect(round2(1.005)).toBe(1.01);
  });
});

describe("convertToBrl", () => {
  test("converte USD em BRL com cotação exata", () => {
    expect(convertToBrl(1000, 5.4321)).toBe(5432.1);
  });

  test("arredonda o resultado para 2 casas", () => {
    expect(convertToBrl(100.5, 5.1234)).toBe(514.9);
  });

  test("lança erro para valor zero", () => {
    expect(() => convertToBrl(0, 5.4)).toThrow();
  });

  test("lança erro para valor negativo", () => {
    expect(() => convertToBrl(-10, 5.4)).toThrow();
  });

  test("lança erro para valor NaN", () => {
    expect(() => convertToBrl(Number.NaN, 5.4)).toThrow();
  });

  test("lança erro para valor infinito", () => {
    expect(() => convertToBrl(Number.POSITIVE_INFINITY, 5.4)).toThrow();
  });

  test("lança erro para cotação zero", () => {
    expect(() => convertToBrl(100, 0)).toThrow();
  });

  test("lança erro para cotação negativa", () => {
    expect(() => convertToBrl(100, -5.4)).toThrow();
  });

  test("lança erro para cotação NaN", () => {
    expect(() => convertToBrl(100, Number.NaN)).toThrow();
  });
});

describe("impliedRate", () => {
  test("calcula a cotação efetiva BRL/USD", () => {
    expect(impliedRate(1000, 5432.1)).toBe(5.4321);
  });

  test("arredonda a cotação para 6 casas", () => {
    expect(impliedRate(3, 10)).toBe(3.333333);
  });

  test("lança erro para USD zero", () => {
    expect(() => impliedRate(0, 5432.1)).toThrow();
  });

  test("lança erro para BRL zero", () => {
    expect(() => impliedRate(1000, 0)).toThrow();
  });

  test("lança erro para BRL negativo", () => {
    expect(() => impliedRate(1000, -5432.1)).toThrow();
  });
});

describe("rateDeviation", () => {
  test("retorna desvio percentual positivo quando efetiva está acima da PTAX", () => {
    expect(rateDeviation(5.5, 5)).toBe(10);
  });

  test("retorna desvio percentual negativo quando efetiva está abaixo da PTAX", () => {
    expect(rateDeviation(4.5, 5)).toBe(-10);
  });

  test("retorna zero quando as cotações são iguais", () => {
    expect(rateDeviation(5, 5)).toBe(0);
  });

  test("lança erro para PTAX zero", () => {
    expect(() => rateDeviation(5.5, 0)).toThrow();
  });

  test("lança erro para cotação efetiva negativa", () => {
    expect(() => rateDeviation(-5.5, 5)).toThrow();
  });
});
