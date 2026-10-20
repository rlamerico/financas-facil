import type { ReceiptRow } from "./receipts-summary";

export const ACCOUNTING_COLUMNS = [
  "Data",
  "Cliente",
  "Origem",
  "Valor USD",
  "Cotação",
  "Valor BRL",
  "NF",
] as const;

export type AccountingRow = Record<(typeof ACCOUNTING_COLUMNS)[number], string>;

export interface ClientInfo {
  id: string;
  name: string;
  origin: "domestic" | "foreign";
}

const ORIGIN_LABELS = {
  domestic: "Brasil",
  foreign: "Exterior",
} as const;

const MONEY_DECIMALS = 2;
const RATE_DECIMALS = 6;
const TOTAL_LABEL = "Total";

function formatDecimal(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(".", ",");
}

/** Converte `YYYY-MM-DD` em `DD/MM/AAAA`. */
function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");

  return `${day}/${month}/${year}`;
}

function findClient(
  clientsById: Readonly<Record<string, ClientInfo>>,
  clientId: string,
): ClientInfo {
  const client = clientsById[clientId];

  if (!client) {
    throw new Error(`Cliente não encontrado para o recebimento: ${clientId}`);
  }

  return client;
}

function toReceiptRow(receipt: ReceiptRow, client: ClientInfo): AccountingRow {
  const isUsd = receipt.currency === "USD";

  return {
    Data: formatDate(receipt.received_on),
    Cliente: client.name,
    Origem: ORIGIN_LABELS[client.origin],
    "Valor USD": isUsd ? formatDecimal(receipt.amount_original, MONEY_DECIMALS) : "",
    Cotação:
      isUsd && receipt.exchange_rate !== null
        ? formatDecimal(receipt.exchange_rate, RATE_DECIMALS)
        : "",
    "Valor BRL": formatDecimal(receipt.amount_brl, MONEY_DECIMALS),
    NF: receipt.invoice_ref ?? "",
  };
}

function sumOf(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function toTotalRow(receipts: readonly ReceiptRow[]): AccountingRow {
  const totalUsd = sumOf(
    receipts
      .filter((receipt) => receipt.currency === "USD")
      .map((receipt) => receipt.amount_original),
  );
  const totalBrl = sumOf(receipts.map((receipt) => receipt.amount_brl));

  return {
    Data: "",
    Cliente: TOTAL_LABEL,
    Origem: "",
    "Valor USD": formatDecimal(totalUsd, MONEY_DECIMALS),
    Cotação: "",
    "Valor BRL": formatDecimal(totalBrl, MONEY_DECIMALS),
    NF: "",
  };
}

/**
 * Linhas para o contador: somente recebimentos `received`, em ordem de data,
 * com linha de total ao final. Entrada vazia retorna lista vazia.
 */
export function toAccountingRows(
  receipts: readonly ReceiptRow[],
  clientsById: Readonly<Record<string, ClientInfo>>,
): AccountingRow[] {
  const received = receipts
    .filter((receipt) => receipt.status === "received")
    .sort((a, b) => a.received_on.localeCompare(b.received_on));

  if (received.length === 0) {
    return [];
  }

  const rows = received.map((receipt) =>
    toReceiptRow(receipt, findClient(clientsById, receipt.client_id)),
  );

  return [...rows, toTotalRow(received)];
}
