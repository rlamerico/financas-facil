import { describe, expect, test } from "vitest";
import { formatRate, formatUsd } from "./money-format";

describe("formatUsd", () => {
  test("formata em dólar com separadores pt-BR", () => {
    expect(formatUsd(1000)).toMatch(/1\.000,00/);
  });

  test("mantém duas casas decimais", () => {
    expect(formatUsd(1234.5)).toMatch(/1\.234,50/);
  });
});

describe("formatRate", () => {
  test("usa vírgula decimal e 4 casas mínimas", () => {
    expect(formatRate(5.4)).toBe("5,4000");
  });

  test("mantém até 6 casas quando a cotação tem mais precisão", () => {
    expect(formatRate(5.432101)).toBe("5,432101");
  });
});
