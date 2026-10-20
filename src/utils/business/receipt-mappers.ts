import type { ReceiptRow } from "./receipts-summary";
import type { ReceiptOrigin } from "./receipt-filters";

interface ReceiptRecord {
  id: string;
  client_id: string;
  received_on: string;
  currency: string;
  amount_original: number;
  exchange_rate: number | null;
  ptax_rate: number | null;
  amount_brl: number;
  invoice_ref: string | null;
  status: string;
}

/** Converte a linha do banco (campos `string`) no tipo tipado usado pelos cálculos. */
export function toReceiptRow(receipt: ReceiptRecord): ReceiptRow {
  return {
    id: receipt.id,
    client_id: receipt.client_id,
    received_on: receipt.received_on,
    currency: receipt.currency === "USD" ? "USD" : "BRL",
    amount_original: receipt.amount_original,
    exchange_rate: receipt.exchange_rate,
    ptax_rate: receipt.ptax_rate,
    amount_brl: receipt.amount_brl,
    invoice_ref: receipt.invoice_ref,
    status: receipt.status === "expected" ? "expected" : "received",
  };
}

/** Origem do cliente para filtros e rótulos; qualquer valor que não seja exterior é tratado como Brasil. */
export function toOrigin(client: { origin: string }): ReceiptOrigin {
  return client.origin === "foreign" ? "foreign" : "domestic";
}
