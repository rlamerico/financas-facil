import { describe, expect, test } from "vitest";
import { filterReceipts } from "./receipt-filters";
import type { ReceiptRow } from "./receipts-summary";

const CLIENT_NATIONAL = "client-national";
const CLIENT_FOREIGN = "client-foreign";

const originByClient: Record<string, "domestic" | "foreign"> = {
  [CLIENT_NATIONAL]: "domestic",
  [CLIENT_FOREIGN]: "foreign",
};

function makeReceipt(overrides: Partial<ReceiptRow>): ReceiptRow {
  return {
    id: "receipt-id",
    client_id: CLIENT_NATIONAL,
    received_on: "2026-10-05",
    currency: "BRL",
    amount_original: 1500,
    exchange_rate: null,
    ptax_rate: null,
    amount_brl: 1500,
    invoice_ref: null,
    status: "received",
    ...overrides,
  };
}

const RECEIPTS = [
  makeReceipt({ id: "national" }),
  makeReceipt({
    id: "foreign",
    client_id: CLIENT_FOREIGN,
    currency: "USD",
    amount_original: 1000,
    exchange_rate: 5.4,
    amount_brl: 5400,
  }),
];

describe("filterReceipts", () => {
  test("sem filtros devolve todos os recebimentos", () => {
    expect(filterReceipts(RECEIPTS, { clientId: null, origin: null }, originByClient)).toHaveLength(2);
  });

  test("filtra por cliente", () => {
    const result = filterReceipts(RECEIPTS, { clientId: CLIENT_FOREIGN, origin: null }, originByClient);

    expect(result.map((receipt) => receipt.id)).toEqual(["foreign"]);
  });

  test("filtra por origem do cliente", () => {
    const result = filterReceipts(RECEIPTS, { clientId: null, origin: "domestic" }, originByClient);

    expect(result.map((receipt) => receipt.id)).toEqual(["national"]);
  });

  test("combina cliente e origem", () => {
    const result = filterReceipts(
      RECEIPTS,
      { clientId: CLIENT_NATIONAL, origin: "foreign" },
      originByClient,
    );

    expect(result).toEqual([]);
  });

  test("não altera a lista de entrada", () => {
    const snapshot = JSON.stringify(RECEIPTS);

    filterReceipts(RECEIPTS, { clientId: CLIENT_FOREIGN, origin: null }, originByClient);

    expect(JSON.stringify(RECEIPTS)).toBe(snapshot);
  });
});
