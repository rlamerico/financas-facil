import { describe, expect, test } from "vitest";
import {
  ACCOUNTING_COLUMNS,
  toAccountingRows,
  type ClientInfo,
} from "./accounting-export";
import type { ReceiptRow } from "./receipts-summary";

const CLIENT_NATIONAL = "client-national";
const CLIENT_FOREIGN = "client-foreign";

const clientsById: Record<string, ClientInfo> = {
  [CLIENT_NATIONAL]: {
    id: CLIENT_NATIONAL,
    name: "Cliente Nacional Ltda",
    origin: "domestic",
  },
  [CLIENT_FOREIGN]: {
    id: CLIENT_FOREIGN,
    name: "Acme Inc",
    origin: "foreign",
  },
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
    invoice_ref: "NF-001",
    status: "received",
    ...overrides,
  };
}

const BRL_RECEIPT = makeReceipt({ id: "brl" });

const USD_RECEIPT = makeReceipt({
  id: "usd",
  client_id: CLIENT_FOREIGN,
  received_on: "2026-10-20",
  currency: "USD",
  amount_original: 1000,
  exchange_rate: 5.4321,
  amount_brl: 5432.1,
  invoice_ref: null,
});

describe("toAccountingRows", () => {
  test("usa exatamente as 7 colunas na ordem pedida pelo contador", () => {
    expect(ACCOUNTING_COLUMNS).toEqual([
      "Data",
      "Cliente",
      "Origem",
      "Valor USD",
      "Cotação",
      "Valor BRL",
      "NF",
    ]);
  });

  test("gera linha de cliente brasileiro sem colunas de dólar", () => {
    const [row] = toAccountingRows([BRL_RECEIPT], clientsById);

    expect(row).toEqual({
      Data: "05/10/2026",
      Cliente: "Cliente Nacional Ltda",
      Origem: "Brasil",
      "Valor USD": "",
      Cotação: "",
      "Valor BRL": "1500,00",
      NF: "NF-001",
    });
  });

  test("gera linha de cliente do exterior com USD, cotação e BRL em formato pt-BR", () => {
    const rows = toAccountingRows([USD_RECEIPT], clientsById);

    expect(rows[0]).toMatchObject({
      Data: "20/10/2026",
      Cliente: "Acme Inc",
      Origem: "Exterior",
      "Valor USD": "1000,00",
      Cotação: "5,432100",
      "Valor BRL": "5432,10",
      NF: "",
    });
  });

  test("ordena as linhas por data de recebimento", () => {
    const rows = toAccountingRows([USD_RECEIPT, BRL_RECEIPT], clientsById);

    expect(rows.map((row) => row.Data)).toEqual(["05/10/2026", "20/10/2026", "" ]);
  });

  test("inclui linha de total ao final com soma em USD e em BRL", () => {
    const rows = toAccountingRows([BRL_RECEIPT, USD_RECEIPT], clientsById);
    const total = rows[rows.length - 1];

    expect(total).toMatchObject({
      Cliente: "Total",
      "Valor USD": "1000,00",
      "Valor BRL": "6932,10",
    });
  });

  test("ignora recebimentos previstos (expected)", () => {
    const expected = makeReceipt({ id: "exp", status: "expected" });

    const rows = toAccountingRows([BRL_RECEIPT, expected], clientsById);

    expect(rows).toHaveLength(2);
  });

  test("entrada vazia retorna lista vazia, sem linha de total", () => {
    expect(toAccountingRows([], clientsById)).toEqual([]);
  });

  test("lança erro explícito quando o cliente do recebimento não existe", () => {
    const orphan = makeReceipt({ id: "orphan", client_id: "missing-client" });

    expect(() => toAccountingRows([orphan], clientsById)).toThrow(
      "missing-client",
    );
  });

  test("não altera a lista de entrada", () => {
    const rows = [USD_RECEIPT, BRL_RECEIPT];
    const snapshot = JSON.stringify(rows);

    toAccountingRows(rows, clientsById);

    expect(JSON.stringify(rows)).toBe(snapshot);
  });
});
