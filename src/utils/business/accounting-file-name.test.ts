import { describe, expect, test } from "vitest";
import { accountingFileName } from "./accounting-file-name";

describe("accountingFileName", () => {
  test("monta o nome com CNPJ só com dígitos, mês e extensão", () => {
    expect(accountingFileName("11.444.777/0001-61", "2026-10", "csv")).toBe(
      "recebimentos-11444777000161-2026-10.csv",
    );
  });

  test("aceita extensão xlsx", () => {
    expect(accountingFileName("11444777000161", "2026-09", "xlsx")).toBe(
      "recebimentos-11444777000161-2026-09.xlsx",
    );
  });

  test("lança erro para mês fora do formato YYYY-MM", () => {
    expect(() => accountingFileName("11444777000161", "10/2026", "csv")).toThrow();
  });

  test("lança erro quando o CNPJ não tem dígitos", () => {
    expect(() => accountingFileName("", "2026-10", "csv")).toThrow();
  });
});
