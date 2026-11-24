import * as XLSX from "xlsx";
import { buildFingerprint, buildFingerprintBase } from "./fingerprint";
import { decodeInstallment } from "./installments";
import {
  normalizeCardName,
  normalizeCategoryLabel,
  normalizeHeader,
  normalizeLastFour,
  parseBrlAmount,
  parsePositiveNumber,
  parsePurchaseDate,
  parseSheetPeriod,
} from "./normalize";
import type {
  ParsedEntry,
  ParsedWorkbook,
  RejectedRow,
  SheetPeriod,
  SkippedSheet,
} from "./types";

const HEADER = {
  purchaseDate: "DATA DE COMPRA",
  cardName: "NOME NO CARTAO",
  lastFour: "FINAL DO CARTAO",
  category: "CATEGORIA",
  description: "DESCRICAO",
  installment: "PARCELA",
  amountUsd: "VALOR (EM US$)",
  fxRate: "COTACAO (EM R$)",
  amount: "VALOR (EM R$)",
} as const;

const REQUIRED_HEADERS = [
  HEADER.purchaseDate,
  HEADER.cardName,
  HEADER.lastFour,
  HEADER.description,
  HEADER.amount,
];

/** Colunas vazias que o Excel criou sozinho ("Coluna 1", "Column 8"). */
const GARBAGE_HEADER = /^(COLUNA|COLUMN)\s*\d+$/;

/** A aba de pivôs não tem lançamentos, só somatórios. */
const SUMMARY_SHEET = /RESUMO/;

/** Índice da coluna que o SheetJS anexa a cada linha (0-based). */
const ROW_NUMBER_KEY = "__rowNum__";

type SheetRow = Record<string, unknown>;
type HeaderMap = Map<string, string>;

type RowOutcome =
  | { kind: "entry"; entry: Omit<ParsedEntry, "fingerprint"> }
  | { kind: "rejected"; reason: string }
  | { kind: "total" };

function mapHeaders(sample: SheetRow): HeaderMap {
  const pairs = Object.keys(sample)
    .filter((key) => key !== ROW_NUMBER_KEY)
    .map((key) => [normalizeHeader(key), key] as const)
    .filter(([normalized]) => normalized !== "" && !GARBAGE_HEADER.test(normalized));

  return new Map(pairs);
}

function cellOf(row: SheetRow, headers: HeaderMap, header: string): unknown {
  const key = headers.get(header);
  return key === undefined ? null : row[key];
}

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  return typeof value === "string" ? value.trim() !== "" : true;
}

function withoutRowNumber(row: SheetRow): SheetRow {
  return Object.fromEntries(Object.entries(row).filter(([key]) => key !== ROW_NUMBER_KEY));
}

function buildEntry(
  row: SheetRow,
  headers: HeaderMap,
  context: { sheetName: string; rowNumber: number; period: SheetPeriod },
  purchaseDate: string,
  amount: number,
): Omit<ParsedEntry, "fingerprint"> {
  const cardNameRaw = String(cellOf(row, headers, HEADER.cardName) ?? "");
  const installment = decodeInstallment(cellOf(row, headers, HEADER.installment));

  return {
    sheetName: context.sheetName,
    rowNumber: context.rowNumber,
    referenceMonth: context.period.referenceMonth,
    referenceYear: context.period.referenceYear,
    purchaseDate,
    cardNameRaw,
    cardNameNormalized: normalizeCardName(cardNameRaw),
    cardLastFour: normalizeLastFour(cellOf(row, headers, HEADER.lastFour)),
    categoryLabel: normalizeCategoryLabel(cellOf(row, headers, HEADER.category)),
    description: String(cellOf(row, headers, HEADER.description) ?? "").trim(),
    amount,
    amountUsd: parsePositiveNumber(cellOf(row, headers, HEADER.amountUsd)),
    fxRate: parsePositiveNumber(cellOf(row, headers, HEADER.fxRate)),
    installmentCurrent: installment.current,
    installmentTotal: installment.total,
    rawInstallment: installment.raw,
  };
}

function parseRow(
  row: SheetRow,
  headers: HeaderMap,
  context: { sheetName: string; rowNumber: number; period: SheetPeriod },
): RowOutcome {
  const rawDate = cellOf(row, headers, HEADER.purchaseDate);
  const rawDescription = cellOf(row, headers, HEADER.description);

  // Sem data E sem descrição é a linha de total que o usuário digitou no
  // rodapé da aba — lixo previsível, não erro de importação.
  if (!isFilled(rawDate) && !isFilled(rawDescription)) return { kind: "total" };

  const purchaseDate = parsePurchaseDate(rawDate);
  if (purchaseDate === null) return { kind: "rejected", reason: "data inválida" };

  const rawAmount = cellOf(row, headers, HEADER.amount);
  if (!isFilled(rawAmount)) return { kind: "rejected", reason: "valor ausente" };

  const amount = parseBrlAmount(rawAmount);
  if (amount === null) return { kind: "rejected", reason: "valor inválido" };

  return { kind: "entry", entry: buildEntry(row, headers, context, purchaseDate, amount) };
}

interface SheetResult {
  entries: ParsedEntry[];
  rejectedRows: RejectedRow[];
  ignoredTotalRows: number;
  skipped: SkippedSheet | null;
}

const EMPTY_SHEET_RESULT: Omit<SheetResult, "skipped"> = {
  entries: [],
  rejectedRows: [],
  ignoredTotalRows: 0,
};

function skip(sheetName: string, reason: string): SheetResult {
  return { ...EMPTY_SHEET_RESULT, skipped: { sheetName, reason } };
}

function parseSheet(sheetName: string, sheet: XLSX.WorkSheet): SheetResult {
  const rows = XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: null, raw: true });
  if (rows.length === 0) return skip(sheetName, "aba vazia");

  const headers = mapHeaders(rows[0]);
  const missing = REQUIRED_HEADERS.filter((header) => !headers.has(header));
  if (missing.length > 0) {
    return skip(sheetName, `colunas obrigatórias ausentes: ${missing.join(", ")}`);
  }

  const period = parseSheetPeriod(sheetName);
  if (period === null) {
    return skip(sheetName, "não foi possível derivar o mês do nome da aba");
  }

  const entries: ParsedEntry[] = [];
  const rejectedRows: RejectedRow[] = [];
  const occurrences = new Map<string, number>();
  let ignoredTotalRows = 0;

  for (const row of rows) {
    const rowNumber = Number(row[ROW_NUMBER_KEY] ?? 0) + 1;
    const outcome = parseRow(row, headers, { sheetName, rowNumber, period });

    if (outcome.kind === "total") {
      ignoredTotalRows += 1;
      continue;
    }
    if (outcome.kind === "rejected") {
      rejectedRows.push({
        sheetName,
        rowNumber,
        reason: outcome.reason,
        raw: withoutRowNumber(row),
      });
      continue;
    }

    const base = buildFingerprintBase(outcome.entry);
    const occurrence = (occurrences.get(base) ?? 0) + 1;
    occurrences.set(base, occurrence);
    entries.push({ ...outcome.entry, fingerprint: buildFingerprint(outcome.entry, occurrence) });
  }

  return { entries, rejectedRows, ignoredTotalRows, skipped: null };
}

/**
 * Lê a planilha de faturas e devolve os lançamentos normalizados.
 *
 * Nunca lança por dado ruim: linha estranha vira `rejectedRows`, aba estranha
 * vira `skippedSheets`. A única exceção que escapa é arquivo ilegível, que o
 * SheetJS levanta ao abrir.
 *
 * `cellDates: true` é obrigatório — sem ele as datas viram serial numérico e a
 * coluna `Parcela` fica indecifrável.
 */
export function parseWorkbook(buffer: ArrayBuffer, fileName: string): ParsedWorkbook {
  // O SheetJS decide o formato com `instanceof ArrayBuffer`, que é falso quando
  // o buffer vem de outro realm (jsdom, iframe, worker) — e aí ele cai no
  // parser de CSV e devolve uma aba "Sheet1" vazia, sem erro nenhum. Passar os
  // bytes já como Uint8Array tira essa checagem do caminho.
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array", cellDates: true });

  const entries: ParsedEntry[] = [];
  const rejectedRows: RejectedRow[] = [];
  const skippedSheets: SkippedSheet[] = [];
  let ignoredTotalRows = 0;

  for (const sheetName of workbook.SheetNames) {
    if (SUMMARY_SHEET.test(normalizeHeader(sheetName))) {
      skippedSheets.push({ sheetName, reason: "aba de resumo (pivôs), sem lançamentos" });
      continue;
    }

    const result = parseSheet(sheetName, workbook.Sheets[sheetName]);
    if (result.skipped) {
      skippedSheets.push(result.skipped);
      continue;
    }

    entries.push(...result.entries);
    rejectedRows.push(...result.rejectedRows);
    ignoredTotalRows += result.ignoredTotalRows;
  }

  return { fileName, entries, rejectedRows, skippedSheets, ignoredTotalRows };
}
