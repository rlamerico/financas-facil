import { describe, expect, test } from "vitest";
import { toOrigin, toReceiptRow } from "./receipt-mappers";

const BASE_RECEIPT = {
  id: "receipt-1",
  client_id: "client-1",
  received_on: "2026-10-05",
  currency: "USD",
  amount_original: 1000,
  exchange_rate: 5.4321,
  ptax_rate: 5.4,
  amount_brl: 5432.1,
  invoice_ref: "NF-1",
  status: "received",
};

describe("toReceiptRow", () => {
  test("mantém os valores do recebimento em USD", () => {
    expect(toReceiptRow(BASE_RECEIPT)).toMatchObject({
      currency: "USD",
      status: "received",
      exchange_rate: 5.4321,
      amount_brl: 5432.1,
    });
  });

  test("normaliza moeda desconhecida para BRL", () => {
    expect(toReceiptRow({ ...BASE_RECEIPT, currency: "BRL" }).currency).toBe("BRL");
  });

  test("normaliza status previsto", () => {
    expect(toReceiptRow({ ...BASE_RECEIPT, status: "expected" }).status).toBe("expected");
  });
});

describe("toOrigin", () => {
  test("cliente do exterior vira foreign", () => {
    expect(toOrigin({ origin: "foreign" })).toBe("foreign");
  });

  test("cliente do Brasil vira domestic", () => {
    expect(toOrigin({ origin: "domestic" })).toBe("domestic");
  });
});
