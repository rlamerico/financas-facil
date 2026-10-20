import { describe, expect, test } from "vitest";
import { monthRange } from "./month-range";

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
