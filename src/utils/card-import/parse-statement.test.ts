import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, test } from "vitest";
import * as XLSX from "xlsx";
import { parseWorkbook } from "./parse-statement";
import type { ParsedEntry, ParsedWorkbook } from "./types";

const FILE_NAME = "Faturas Cartão de Crédito.xlsx";
const FILE_PATH = path.join(process.cwd(), "files", FILE_NAME);
const HAS_REAL_FIXTURE = existsSync(FILE_PATH);

/** O `fs` só aparece aqui, no teste: o parser em si é isomórfico. */
function readFixture(): ArrayBuffer {
  const buffer = readFileSync(FILE_PATH);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

function buildWorkbook(sheets: Record<string, unknown[][]>): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), name);
  }
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

describe.skipIf(!HAS_REAL_FIXTURE)("parseWorkbook sobre a planilha real", () => {
  let parsed: ParsedWorkbook;

  beforeAll(() => {
    parsed = parseWorkbook(readFixture(), FILE_NAME);
  });

  // CA-02
  test("classifica as 2.714 linhas não-vazias em 2.692 entries, 13 rejeitadas e 9 totais", () => {
    expect(parsed.entries).toHaveLength(2692);
    expect(parsed.rejectedRows).toHaveLength(13);
    expect(parsed.ignoredTotalRows).toBe(9);

    const totalLinhas =
      parsed.entries.length + parsed.rejectedRows.length + parsed.ignoredTotalRows;
    expect(totalLinhas).toBe(2714);
  });

  // CA-02
  test("os 13 motivos de rejeição são 1 sem data, 10 sem valor e 2 com valor ambíguo", () => {
    const porMotivo = parsed.rejectedRows.reduce<Record<string, number>>((acc, row) => {
      return { ...acc, [row.reason]: (acc[row.reason] ?? 0) + 1 };
    }, {});

    expect(porMotivo).toEqual({
      "data inválida": 1,
      "valor ausente": 10,
      "valor inválido": 2,
    });
  });

  // CA-02
  test('pula a aba de pivôs "Resumo Cartões" sem tentar interpretá-la', () => {
    expect(parsed.skippedSheets.map((sheet) => sheet.sheetName)).toEqual(["Resumo Cartões"]);
    expect(parsed.skippedSheets[0].reason).toMatch(/resumo/i);
  });

  test("deriva mês e ano do nome da aba, sem chutar o ano das abas sem ano", () => {
    const fevereiro = parsed.entries.find((entry) => entry.sheetName === "Fevereiro 2026");
    expect(fevereiro).toMatchObject({ referenceMonth: 2, referenceYear: 2026 });

    const janeiro = parsed.entries.find((entry) => entry.sheetName === "Janeiro 26");
    expect(janeiro).toMatchObject({ referenceMonth: 1, referenceYear: 2026 });

    const agosto = parsed.entries.find((entry) => entry.sheetName === "Agosto");
    expect(agosto).toMatchObject({ referenceMonth: 8, referenceYear: null });
  });

  test("normaliza cartão, categoria e descrição de todo lançamento", () => {
    for (const entry of parsed.entries) {
      expect(entry.cardLastFour).toMatch(/^\d{4}$/);
      expect(entry.cardNameNormalized).toBe(entry.cardNameNormalized.toUpperCase());
      expect(entry.description).toBe(entry.description.trim());
      expect(entry.categoryLabel).not.toBe("-");
      expect(entry.purchaseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  // CA-03
  test("nenhuma fingerprint se repete dentro da mesma aba", () => {
    const porAba = new Map<string, Set<string>>();
    for (const entry of parsed.entries) {
      const set = porAba.get(entry.sheetName) ?? new Set<string>();
      set.add(entry.fingerprint);
      porAba.set(entry.sheetName, set);
    }

    for (const [sheetName, chaves] of porAba) {
      const linhasDaAba = parsed.entries.filter((entry) => entry.sheetName === sheetName);
      expect(chaves.size).toBe(linhasDaAba.length);
    }
  });

  // CA-03
  test("as duplicatas legítimas continuam presentes como entries distintos", () => {
    const chaveNatural = (entry: ParsedEntry) =>
      [
        entry.sheetName,
        entry.purchaseDate,
        entry.description,
        entry.amount,
        entry.cardLastFour,
      ].join("|");

    const distintas = new Set(parsed.entries.map(chaveNatural));

    // A planilha tem 33 linhas repetidas nessa chave natural. Duas delas não
    // podem virar entry — um par "Pagamento Fatura QR CODE" sem valor (rejeitado
    // por CA-02) e um par de linha de total do rodapé (ignorado por CA-06c) —
    // então sobram 31 repetições legítimas entre os lançamentos.
    expect(parsed.entries.length - distintas.size).toBe(31);
  });

  // CA-04
  test("reparsear o mesmo arquivo produz exatamente as mesmas fingerprints", () => {
    const outra = parseWorkbook(readFixture(), FILE_NAME);
    expect(outra.entries.map((entry) => entry.fingerprint)).toEqual(
      parsed.entries.map((entry) => entry.fingerprint),
    );
  });

  // CA-05
  test("as 107 datas em string dd/mm/aaaa viram ISO com dia e mês na ordem certa", () => {
    const workbook = XLSX.read(new Uint8Array(readFixture()), {
      type: "array",
      cellDates: true,
    });
    const porLinha = new Map(
      parsed.entries.map((entry) => [`${entry.sheetName}|${entry.rowNumber}`, entry]),
    );

    let conferidas = 0;
    for (const sheetName of workbook.SheetNames) {
      if (sheetName === "Resumo Cartões") continue;
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
        defval: null,
        raw: true,
      });
      for (const row of rows) {
        const bruta = row["Data de Compra"];
        if (typeof bruta !== "string") continue;

        const [dia, mes, ano] = bruta.split("/");
        const esperada = `${ano}-${mes}-${dia}`;
        const linha = Number(row["__rowNum__"]) + 1;
        expect(porLinha.get(`${sheetName}|${linha}`)?.purchaseDate).toBe(esperada);
        conferidas += 1;
      }
    }

    expect(conferidas).toBe(107);
  });

  // CA-06
  test("os 38 lançamentos negativos mantêm o sinal", () => {
    const negativos = parsed.entries.filter((entry) => entry.amount < 0);
    expect(negativos).toHaveLength(38);
    expect(negativos.every((entry) => entry.amount < 0)).toBe(true);
  });

  // CA-06b
  test('"R$ 9,49" é recuperado como 9.49', () => {
    const recuperado = parsed.entries.find(
      (entry) => entry.sheetName === "Setembro" && entry.rowNumber === 29,
    );
    expect(recuperado?.amount).toBe(9.49);
  });

  // CA-06b
  test("valor com duas vírgulas é rejeitado, nunca adivinhado", () => {
    const ambiguas = parsed.rejectedRows.filter((row) => row.reason === "valor inválido");
    expect(ambiguas.map((row) => `${row.sheetName}|${row.rowNumber}`)).toEqual([
      "Novembro|67",
      "Junho 2026|108",
    ]);

    const valoresAdivinhados = parsed.entries.filter(
      (entry) => entry.amount === 45972 || entry.amount === 45.97 || entry.amount === 46333,
    );
    expect(valoresAdivinhados).toHaveLength(0);
  });

  // CA-06c
  test("as 9 linhas de total do rodapé não viram entries", () => {
    const linhasDeTotal = [
      "Outubro|192",
      "Outubro|193",
      "Outubro|194",
      "Novembro|223",
      "Maio 2026|206",
      "Julho 2026|191",
      "Julho 2026|192",
      "Julho 2026|193",
      "Julho 2026|194",
    ];
    const posicoes = new Set(
      parsed.entries.map((entry) => `${entry.sheetName}|${entry.rowNumber}`),
    );

    for (const linha of linhasDeTotal) {
      expect(posicoes.has(linha)).toBe(false);
    }
    expect(parsed.ignoredTotalRows).toBe(linhasDeTotal.length);
  });

  test("linha sem data mas com descrição é reportada como erro, não silenciada", () => {
    const semData = parsed.rejectedRows.find((row) => row.reason === "data inválida");
    expect(semData).toMatchObject({ sheetName: "Março 2026", rowNumber: 60 });
    expect(semData?.raw["Descrição"]).toBe("Adapta.Org");
  });

  test("preenche câmbio só quando a compra foi em dólar", () => {
    for (const entry of parsed.entries) {
      expect(entry.amountUsd === null || entry.amountUsd > 0).toBe(true);
      expect(entry.fxRate === null || entry.fxRate > 0).toBe(true);
    }
  });

  test("decodifica o parcelamento dos lançamentos com mais de 12 parcelas", () => {
    const longos = parsed.entries.filter((entry) => entry.installmentTotal === 14);
    expect(longos.length).toBeGreaterThan(0);
    expect(longos.every((entry) => entry.rawInstallment?.endsWith("/14"))).toBe(true);
  });
});

describe("parseWorkbook em planilhas sintéticas", () => {
  const cabecalho = [
    "Data de Compra",
    "Nome no Cartão",
    "Final do Cartão",
    "Categoria",
    "Descrição",
    "Parcela",
    "Valor (em R$)",
  ];

  // CA-07
  test("aba sem coluna obrigatória entra em skippedSheets sem lançar exceção", () => {
    const buffer = buildWorkbook({
      "Janeiro 2026": [
        ["Data de Compra", "Nome no Cartão", "Descrição"],
        [new Date(2026, 0, 5), "RODRIGO", "MERCADO"],
      ],
    });

    const parsed = parseWorkbook(buffer, "quebrada.xlsx");

    expect(parsed.entries).toHaveLength(0);
    expect(parsed.skippedSheets).toHaveLength(1);
    expect(parsed.skippedSheets[0].reason).toContain("FINAL DO CARTAO");
  });

  // CA-07
  test("uma aba quebrada não impede as outras de serem parseadas", () => {
    const buffer = buildWorkbook({
      Quebrada: [["Data de Compra"], [new Date(2026, 0, 5)]],
      "Janeiro 2026": [cabecalho, [new Date(2026, 0, 5), "RODRIGO", 3783, "-", " PADARIA ", "Única", 12.5]],
    });

    const parsed = parseWorkbook(buffer, "mista.xlsx");

    expect(parsed.skippedSheets.map((sheet) => sheet.sheetName)).toEqual(["Quebrada"]);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0]).toMatchObject({
      sheetName: "Janeiro 2026",
      rowNumber: 2,
      referenceMonth: 1,
      referenceYear: 2026,
      purchaseDate: "2026-01-05",
      cardNameRaw: "RODRIGO",
      cardLastFour: "3783",
      categoryLabel: null,
      description: "PADARIA",
      amount: 12.5,
      amountUsd: null,
      fxRate: null,
      installmentCurrent: 1,
      installmentTotal: 1,
    });
  });

  test("colunas de lixo do Excel são descartadas pelo nome", () => {
    const buffer = buildWorkbook({
      "Janeiro 2026": [
        [...cabecalho, "Coluna 1", "Column 8"],
        [new Date(2026, 0, 5), "RODRIGO", 3783, "Educacional", "CURSO", "1/14", 99, null, null],
      ],
    });

    const parsed = parseWorkbook(buffer, "lixo.xlsx");

    expect(parsed.skippedSheets).toHaveLength(0);
    expect(parsed.entries[0]).toMatchObject({
      categoryLabel: "Educacional",
      installmentCurrent: 1,
      installmentTotal: 14,
      rawInstallment: "1/14",
    });
  });

  test("aba vazia é pulada em vez de virar erro", () => {
    const buffer = buildWorkbook({ Vazia: [[]] });
    const parsed = parseWorkbook(buffer, "vazia.xlsx");

    expect(parsed.entries).toHaveLength(0);
    expect(parsed.skippedSheets).toHaveLength(1);
  });

  test("aba com nome sem mês reconhecível é pulada, não datada por chute", () => {
    const buffer = buildWorkbook({
      Planilha1: [cabecalho, [new Date(2026, 0, 5), "RODRIGO", 3783, "-", "PADARIA", "Única", 12.5]],
    });

    const parsed = parseWorkbook(buffer, "sem-mes.xlsx");

    expect(parsed.entries).toHaveLength(0);
    expect(parsed.skippedSheets[0]).toMatchObject({ sheetName: "Planilha1" });
  });

  test("lança apenas quando o arquivo é ilegível", () => {
    // Um .xlsx é um zip: assinatura PK válida com o conteúdo truncado é o
    // arquivo corrompido que o SheetJS não consegue abrir.
    const zipTruncado = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(() => parseWorkbook(zipTruncado.buffer, "corrompido.xlsx")).toThrow();
  });

  test("guarda o nome do arquivo recebido", () => {
    const buffer = buildWorkbook({ Vazia: [[]] });
    expect(parseWorkbook(buffer, "extrato.xlsx").fileName).toBe("extrato.xlsx");
  });
});
