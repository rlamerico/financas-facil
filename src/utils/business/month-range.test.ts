import { describe, expect, test } from "vitest";
import { formatMonthKey, monthRange } from "./month-range";

describe("formatMonthKey", () => {
  test("formata a data local no formato YYYY-MM", () => {
    expect(formatMonthKey(new Date(2026, 9, 20))).toBe("2026-10");
  });

  test("preenche o mês com zero à esquerda", () => {
    expect(formatMonthKey(new Date(2026, 0, 3))).toBe("2026-01");
  });
});

describe("monthRange", () => {
  test("retorna do primeiro dia até o primeiro dia do mês seguinte (exclusivo)", () => {
    expect(monthRange("2026-10")).toEqual({
      from: "2026-10-01",
      to: "2026-11-01",
    });
  });

  test("vira o ano ao montar o intervalo de dezembro", () => {
    expect(monthRange("2026-12")).toEqual({
      from: "2026-12-01",
      to: "2027-01-01",
    });
  });

  test("lança erro para mês fora do formato YYYY-MM", () => {
    expect(() => monthRange("2026-1")).toThrow();
  });

  test("lança erro para mês inexistente", () => {
    expect(() => monthRange("2026-13")).toThrow();
  });
});
