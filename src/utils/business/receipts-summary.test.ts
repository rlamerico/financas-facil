import { describe, expect, test } from "vitest";
import { summarizeReceipts, type ReceiptRow } from "./receipts-summary";

const CLIENT_A = "client-a";
const CLIENT_B = "client-b";

function makeReceipt(overrides: Partial<ReceiptRow>): ReceiptRow {
  return {
    id: "receipt-id",
    client_id: CLIENT_A,
    received_on: "2026-10-05",
    currency: "BRL",
    amount_original: 1000,
    exchange_rate: null,
    ptax_rate: null,
    amount_brl: 1000,
    invoice_ref: null,
    status: "received",
    ...overrides,
  };
}

const USD_RECEIPT_1000 = makeReceipt({
  id: "usd-1000",
  client_id: CLIENT_B,
  currency: "USD",
  amount_original: 1000,
  exchange_rate: 5.4321,
  amount_brl: 5432.1,
});

const USD_RECEIPT_500 = makeReceipt({
  id: "usd-500",
  client_id: CLIENT_B,
  received_on: "2026-10-20",
  currency: "USD",
  amount_original: 500,
  exchange_rate: 5.5,
  amount_brl: 2750,
});

const BRL_RECEIPT = makeReceipt({
  id: "brl-1500",
  client_id: CLIENT_A,
  amount_original: 1500,
  amount_brl: 1500,
});

describe("summarizeReceipts", () => {
  test("totaliza BRL e USD separando origem doméstica e exterior", () => {
    const summary = summarizeReceipts([BRL_RECEIPT, USD_RECEIPT_1000], {
      month: "2026-10",
    });

    expect(summary.totalBrl).toBe(6932.1);
    expect(summary.totalUsd).toBe(1000);
    expect(summary.domesticBrl).toBe(1500);
    expect(summary.foreignBrl).toBe(5432.1);
  });

  test("calcula a cotação média ponderada pelo valor em USD", () => {
    const summary = summarizeReceipts([USD_RECEIPT_1000, USD_RECEIPT_500], {
      month: "2026-10",
    });

    expect(summary.weightedAvgRate).toBe(5.454733);
  });

  test("retorna cotação média nula quando não há recebimento em USD", () => {
    const summary = summarizeReceipts([BRL_RECEIPT], { month: "2026-10" });

    expect(summary.weightedAvgRate).toBeNull();
  });

  test("ignora recebimentos previstos (expected)", () => {
    const expected = makeReceipt({
      id: "exp",
      status: "expected",
      amount_original: 900,
      amount_brl: 900,
    });

    const summary = summarizeReceipts([BRL_RECEIPT, expected], {
      month: "2026-10",
    });

    expect(summary.totalBrl).toBe(1500);
  });

  test("ignora recebimentos de outros meses", () => {
    const otherMonth = makeReceipt({
      id: "sept",
      received_on: "2026-09-30",
      amount_original: 700,
      amount_brl: 700,
    });

    const summary = summarizeReceipts([BRL_RECEIPT, otherMonth], {
      month: "2026-10",
    });

    expect(summary.totalBrl).toBe(1500);
  });

  test("agrupa por cliente com totais em BRL e USD, ordenado por BRL", () => {
    const summary = summarizeReceipts(
      [BRL_RECEIPT, USD_RECEIPT_1000, USD_RECEIPT_500],
      { month: "2026-10" },
    );

    expect(summary.byClient).toEqual([
      { clientId: CLIENT_B, totalBrl: 8182.1, totalUsd: 1500 },
      { clientId: CLIENT_A, totalBrl: 1500, totalUsd: 0 },
    ]);
  });

  test("entrada vazia retorna totais zerados e lista vazia", () => {
    const summary = summarizeReceipts([], { month: "2026-10" });

    expect(summary).toEqual({
      totalBrl: 0,
      totalUsd: 0,
      domesticBrl: 0,
      foreignBrl: 0,
      weightedAvgRate: null,
      byClient: [],
    });
  });

  test("não altera a lista de entrada", () => {
    const rows = [BRL_RECEIPT, USD_RECEIPT_1000];
    const snapshot = JSON.stringify(rows);

    summarizeReceipts(rows, { month: "2026-10" });

    expect(JSON.stringify(rows)).toBe(snapshot);
  });
});
