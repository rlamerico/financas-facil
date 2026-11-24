export interface ParsedEntry {
  sheetName: string;
  /** Linha na planilha (1-based, cabeçalho = 1). */
  rowNumber: number;
  /** 1-12, derivado do nome da aba. */
  referenceMonth: number;
  /** null quando a aba não traz o ano ("Agosto"). */
  referenceYear: number | null;
  /** ISO "YYYY-MM-DD". */
  purchaseDate: string;
  cardNameRaw: string;
  cardNameNormalized: string;
  /** Sempre 4 dígitos. */
  cardLastFour: string;
  categoryLabel: string | null;
  description: string;
  /** BRL, pode ser negativo. */
  amount: number;
  amountUsd: number | null;
  fxRate: number | null;
  installmentCurrent: number | null;
  installmentTotal: number | null;
  rawInstallment: string | null;
  fingerprint: string;
}

export interface RejectedRow {
  sheetName: string;
  rowNumber: number;
  reason: string;
  raw: Record<string, unknown>;
}

export interface SkippedSheet {
  sheetName: string;
  reason: string;
}

export interface ParsedWorkbook {
  fileName: string;
  entries: ParsedEntry[];
  rejectedRows: RejectedRow[];
  skippedSheets: SkippedSheet[];
  /** Linhas de total do rodapé (sem data e sem descrição). Descartadas de
   *  propósito — não são erro, mas precisam ser reportadas para o usuário
   *  conferir que nenhum lançamento real caiu aqui. */
  ignoredTotalRows: number;
}

export interface DecodedInstallment {
  current: number | null;
  total: number | null;
  raw: string | null;
}

/** Período de uma fatura, derivado do nome da aba. */
export interface SheetPeriod {
  referenceMonth: number;
  referenceYear: number | null;
}
