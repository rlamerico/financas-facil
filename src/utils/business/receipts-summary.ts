import { impliedRate, round2 } from "./convert-currency";

export interface ReceiptRow {
  id: string;
  client_id: string;
  received_on: string;
  currency: "BRL" | "USD";
  amount_original: number;
  exchange_rate: number | null;
  ptax_rate: number | null;
  amount_brl: number;
  invoice_ref: string | null;
  status: "expected" | "received";
}

export interface ReceiptSummaryOptions {
  /** Mês no formato YYYY-MM. */
  month: string;
}

export interface ClientTotals {
  clientId: string;
  totalBrl: number;
  totalUsd: number;
}

export interface ReceiptSummary {
  totalBrl: number;
  totalUsd: number;
  domesticBrl: number;
  foreignBrl: number;
  weightedAvgRate: number | null;
  byClient: ClientTotals[];
}

function isReceivedInMonth(receipt: ReceiptRow, month: string): boolean {
  return receipt.status === "received" && receipt.received_on.startsWith(`${month}-`);
}

function sumBy(rows: readonly ReceiptRow[], pick: (row: ReceiptRow) => number): number {
  return rows.reduce((total, row) => total + pick(row), 0);
}

function groupByClient(rows: readonly ReceiptRow[]): ClientTotals[] {
  const totals = new Map<string, { totalBrl: number; totalUsd: number }>();

  for (const row of rows) {
    const current = totals.get(row.client_id) ?? { totalBrl: 0, totalUsd: 0 };

    totals.set(row.client_id, {
      totalBrl: current.totalBrl + row.amount_brl,
      totalUsd: current.totalUsd + (row.currency === "USD" ? row.amount_original : 0),
    });
  }

  return [...totals]
    .map(([clientId, { totalBrl, totalUsd }]) => ({
      clientId,
      totalBrl: round2(totalBrl),
      totalUsd: round2(totalUsd),
    }))
    .sort((a, b) => b.totalBrl - a.totalBrl);
}

/** Totaliza somente recebimentos `received` do mês informado. */
export function summarizeReceipts(
  rows: readonly ReceiptRow[],
  { month }: ReceiptSummaryOptions,
): ReceiptSummary {
  const received = rows.filter((row) => isReceivedInMonth(row, month));
  const usdRows = received.filter((row) => row.currency === "USD");
  const brlRows = received.filter((row) => row.currency === "BRL");

  const usdTotal = sumBy(usdRows, (row) => row.amount_original);
  const foreignBrl = sumBy(usdRows, (row) => row.amount_brl);
  const domesticBrl = sumBy(brlRows, (row) => row.amount_brl);

  return {
    totalBrl: round2(domesticBrl + foreignBrl),
    totalUsd: round2(usdTotal),
    domesticBrl: round2(domesticBrl),
    foreignBrl: round2(foreignBrl),
    weightedAvgRate: usdRows.length > 0 ? impliedRate(usdTotal, foreignBrl) : null,
    byClient: groupByClient(received),
  };
}
