import { describe, expect, test } from "vitest";
import * as XLSX from "xlsx";
import { buildWorkbook, toCsv, toJson } from "./export";

describe("toCsv", () => {
  test("retorna string vazia para lista vazia", () => {
    expect(toCsv([])).toBe("");
  });

  test("gera cabeçalho a partir das chaves do primeiro objeto", () => {
    const csv = toCsv([{ nome: "Mercado", valor: 100 }]);
    expect(csv).toBe("nome;valor\nMercado;100");
  });

  test("gera uma linha por item, na mesma ordem", () => {
    const csv = toCsv([
      { nome: "Mercado", valor: 100 },
      { nome: "Transporte", valor: 50 },
    ]);
    expect(csv).toBe("nome;valor\nMercado;100\nTransporte;50");
  });

  test("valores nulos/indefinidos viram string vazia", () => {
    const csv = toCsv([{ nome: "X", categoria: null }]);
    expect(csv).toBe("nome;categoria\nX;");
  });

  test("escapa valores com ponto e vírgula, aspas ou quebra de linha", () => {
    const csv = toCsv([{ descricao: 'Compra "grande"; especial' }]);
    expect(csv).toBe('descricao\n"Compra ""grande""; especial"');
  });
});

describe("toJson", () => {
  test("serializa como JSON indentado", () => {
    const json = toJson([{ nome: "Mercado", valor: 100 }]);
    expect(JSON.parse(json)).toEqual([{ nome: "Mercado", valor: 100 }]);
    expect(json).toContain("\n");
  });

  test("lista vazia vira array JSON vazio", () => {
    expect(toJson([])).toBe("[]");
  });
});

describe("buildWorkbook", () => {
  test("lista de abas vazia gera workbook sem abas", () => {
    const workbook = buildWorkbook([]);
    expect(workbook.SheetNames).toEqual([]);
  });

  test("cria uma aba por item, na ordem informada", () => {
    const workbook = buildWorkbook([
      { name: "Transações", rows: [{ descricao: "Mercado", valor: 100 }] },
      { name: "Categorias", rows: [{ nome: "Alimentação" }] },
    ]);

    expect(workbook.SheetNames).toEqual(["Transações", "Categorias"]);
  });

  test("os dados de cada aba são preservados (round-trip via sheet_to_json)", () => {
    const rows = [
      { descricao: "Mercado", valor: 100 },
      { descricao: "Transporte", valor: 50 },
    ];
    const workbook = buildWorkbook([{ name: "Transações", rows }]);
    const sheet = workbook.Sheets["Transações"];

    expect(XLSX.utils.sheet_to_json(sheet)).toEqual(rows);
  });

  test("aba com lista vazia de linhas não quebra a montagem do workbook", () => {
    const workbook = buildWorkbook([{ name: "Vazia", rows: [] }]);
    expect(workbook.SheetNames).toEqual(["Vazia"]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets["Vazia"])).toEqual([]);
  });

  test("nome de aba maior que 31 caracteres é truncado", () => {
    const longName = "Nome de aba muito longo que excede o limite do Excel";
    const workbook = buildWorkbook([{ name: longName, rows: [] }]);

    expect(workbook.SheetNames[0].length).toBeLessThanOrEqual(31);
    expect(workbook.SheetNames[0]).toBe(longName.slice(0, 31));
  });

  test("remove caracteres inválidos de nome de aba ([ ] : * ? / \\)", () => {
    const workbook = buildWorkbook([{ name: "Relatório [2026]: Q1/Q2*?\\", rows: [] }]);
    expect(workbook.SheetNames[0]).toBe("Relatório 2026 Q1Q2");
  });
});
