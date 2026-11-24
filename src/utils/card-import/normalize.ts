import type { SheetPeriod } from "./types";

/** Meses por extenso, já sem acento — o índice + 1 é o número do mês. */
const MONTH_NAMES = [
  "JANEIRO",
  "FEVEREIRO",
  "MARCO",
  "ABRIL",
  "MAIO",
  "JUNHO",
  "JULHO",
  "AGOSTO",
  "SETEMBRO",
  "OUTUBRO",
  "NOVEMBRO",
  "DEZEMBRO",
];

/** Só o formato BRL bem-formado é aceito: "1.234,56", "9,49", "-1.234,56".
 *  Strings com duas vírgulas ("45,972,00") ficam de fora de propósito —
 *  adivinhar valor em dado financeiro é pior do que rejeitar a linha. */
const BRL_AMOUNT = /^-?\d{1,3}(\.\d{3})*,\d{2}$/;

const DDMMYYYY = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/;

const CENTURY_BASE = 2000;

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : String(value);
}

/** Chave de comparação de cabeçalho: maiúsculo, sem acento, sem espaço duplo. */
export function normalizeHeader(value: unknown): string {
  return collapseSpaces(stripAccents(asString(value)).toUpperCase());
}

/** Chave de comparação de cartão: além do cabeçalho, `-` e `_` viram espaço,
 *  para que "UBER-IEDA" e "Uber Ieda" sejam o mesmo apelido. */
export function normalizeCardName(value: unknown): string {
  const withSpaces = stripAccents(asString(value)).toUpperCase().replace(/[-_]+/g, " ");
  return collapseSpaces(withSpaces);
}

/** O final do cartão vem como number (`3783`) e às vezes com um `.0` que o
 *  Excel anexa. A fração zerada é cortada ANTES de extrair os dígitos: sem
 *  isso "3783.0" viraria "37830" e o cartão passaria a terminar em 7830. */
export function normalizeLastFour(value: unknown): string {
  const digits = asString(value).trim().replace(/[.,]0+$/, "").replace(/\D/g, "");
  return digits.padStart(4, "0").slice(-4);
}

/** `-`, vazio e null são a mesma coisa na planilha: sem categoria. */
export function normalizeCategoryLabel(value: unknown): string | null {
  const label = asString(value).trim();
  if (label === "" || label === "-") return null;
  return label;
}

function toIsoDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  if (!isRealDate) return null;

  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");
  return `${year}-${paddedMonth}-${paddedDay}`;
}

/**
 * A data de compra vem como `Date` na maioria das linhas e como string
 * `dd/mm/aaaa` em 107 delas. Devolve ISO "YYYY-MM-DD" ou null.
 *
 * O `Date` é lido pelos getters locais porque é assim que o SheetJS monta a
 * célula (meia-noite local); ler em UTC escorregaria um dia em fusos positivos.
 */
export function parsePurchaseDate(value: unknown): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return toIsoDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  const text = asString(value).trim();
  const match = DDMMYYYY.exec(text);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const rawYear = Number(match[3]);
  const year = match[3].length === 2 ? CENTURY_BASE + rawYear : rawYear;
  return toIsoDate(year, month, day);
}

/**
 * Valor em reais: aceita number e string BRL bem-formada. Negativos são
 * válidos (estornos) e preservados. Devolve null quando ausente ou ambíguo.
 */
export function parseBrlAmount(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;

  const cleaned = value.replace(/R\$/gi, "").replace(/\s/g, "");
  if (!BRL_AMOUNT.test(cleaned)) return null;

  return Number(cleaned.replace(/\./g, "").replace(",", "."));
}

/** Câmbio e valor em dólar: as colunas existem em 4 abas e trazem `0` para
 *  compras em BRL, o que não é cotação nenhuma. */
export function parsePositiveNumber(value: unknown): number | null {
  const parsed = parseBrlAmount(value);
  if (parsed === null || parsed <= 0) return null;
  return parsed;
}

/**
 * Deriva o período da fatura do nome da aba: "Fevereiro 2026" → 2/2026,
 * "Janeiro 26" → 1/2026, "Agosto" → 8/null.
 *
 * Sem ano na aba o ano fica `null` de propósito: chutar ano em fatura é como
 * se cria duplicata no ano errado — quem pergunta é a UI de importação.
 */
export function parseSheetPeriod(sheetName: string): SheetPeriod | null {
  const normalized = normalizeHeader(sheetName);
  const monthIndex = MONTH_NAMES.findIndex((month) => normalized.startsWith(month));
  if (monthIndex === -1) return null;

  const rest = normalized.slice(MONTH_NAMES[monthIndex].length).trim();
  const yearMatch = /^(\d{2}|\d{4})$/.exec(rest);
  if (!yearMatch) return { referenceMonth: monthIndex + 1, referenceYear: null };

  const rawYear = Number(yearMatch[1]);
  return {
    referenceMonth: monthIndex + 1,
    referenceYear: yearMatch[1].length === 2 ? CENTURY_BASE + rawYear : rawYear,
  };
}
