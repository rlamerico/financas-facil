import type { DecodedInstallment } from "./types";

const EMPTY: DecodedInstallment = { current: null, total: null, raw: null };

/** Epoch do serial do Excel: o dia 0 é 1899-12-30 (o bug do ano bissexto de 1900). */
const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 86_400_000;

/** 1 = 1899-12-31; 2958465 = 9999-12-31, o teto do Excel. */
const MIN_SERIAL = 1;
const MAX_SERIAL = 2_958_465;

const UNICA = /^unica$/i;
const FRACTION = /^(\d{1,3})\s*\/\s*(\d{1,3})$/;
const SERIAL = /^\d{1,7}$/;

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function decoded(current: number, total: number, raw: string): DecodedInstallment {
  if (current < 1 || total < 1) return { ...EMPTY, raw };
  return { current, total, raw };
}

/** Data local (como o SheetJS monta a célula) → dia = parcela, mês = total. */
function fromDate(date: Date): DecodedInstallment {
  const raw = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
  return decoded(date.getDate(), date.getMonth() + 1, raw);
}

/** O serial é convertido e lido em UTC para não escorregar de dia por fuso. */
function fromSerial(serial: number, raw: string): DecodedInstallment {
  if (!Number.isInteger(serial) || serial < MIN_SERIAL || serial > MAX_SERIAL) {
    return { ...EMPTY, raw };
  }
  const date = new Date(EXCEL_EPOCH_MS + serial * MS_PER_DAY);
  return decoded(date.getUTCDate(), date.getUTCMonth() + 1, raw);
}

/**
 * Decodifica a coluna `Parcela` da fatura.
 *
 * O Excel converteu "6/10" (parcela 6 de 10) em data 2025-10-06 sob locale
 * pt-BR. A regra reversa é: dia = parcela atual, mês = total de parcelas.
 * Parcelamentos com mais de 12 parcelas sobrevivem como texto ("1/14"),
 * porque não existe mês 14.
 */
export function decodeInstallment(value: unknown): DecodedInstallment {
  if (value === null || value === undefined) return EMPTY;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? EMPTY : fromDate(value);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return EMPTY;
    return fromSerial(value, String(value));
  }

  if (typeof value !== "string") return EMPTY;

  const raw = value.trim();
  if (raw === "") return EMPTY;
  if (UNICA.test(stripAccents(raw))) return { current: 1, total: 1, raw };

  const fraction = FRACTION.exec(raw);
  if (fraction) return decoded(Number(fraction[1]), Number(fraction[2]), raw);

  if (SERIAL.test(raw)) return fromSerial(Number(raw), raw);

  return { ...EMPTY, raw };
}
