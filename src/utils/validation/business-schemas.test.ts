import { describe, expect, test } from "vitest";
import {
  businessClientSchema,
  businessReceiptSchema,
  companySchema,
  ptaxDateSchema,
} from "./business-schemas";

const VALID_CNPJ = "11.444.777/0001-61";
const FUTURE_DATE = "2999-01-01";
const PAST_DATE = "2026-10-16";
const CLIENT_ID = "3f1c2a7e-8d4b-4c1a-9e2f-000000000001";

describe("companySchema", () => {
  const validCompany = {
    legal_name: "Rodrigo Americo MEI",
    trade_name: "Estúdio Rodrigo",
    cnpj: VALID_CNPJ,
    regime: "mei",
  };

  test("aceita empresa válida e normaliza o CNPJ para dígitos", () => {
    const result = companySchema.safeParse(validCompany);

    expect(result.success).toBe(true);
    expect(result.success && result.data.cnpj).toBe("11444777000161");
  });

  test("aceita trade_name ausente", () => {
    expect(
      companySchema.safeParse({ ...validCompany, trade_name: undefined }).success,
    ).toBe(true);
  });

  test("rejeita CNPJ inválido com mensagem em português", () => {
    const result = companySchema.safeParse({
      ...validCompany,
      cnpj: "11444777000162",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("CNPJ inválido.");
  });

  test("rejeita razão social vazia", () => {
    expect(
      companySchema.safeParse({ ...validCompany, legal_name: "   " }).success,
    ).toBe(false);
  });

  test("rejeita regime fora de mei, simples e outro", () => {
    expect(
      companySchema.safeParse({ ...validCompany, regime: "lucro" }).success,
    ).toBe(false);
  });

  test("aceita regime simples", () => {
    expect(
      companySchema.safeParse({ ...validCompany, regime: "simples" }).success,
    ).toBe(true);
  });
});

describe("businessClientSchema", () => {
  test("aceita cliente do Brasil com CNPJ válido e assume BRL por padrão", () => {
    const result = businessClientSchema.safeParse({
      name: "Cliente Nacional Ltda",
      origin: "domestic",
      document: VALID_CNPJ,
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.default_currency).toBe("BRL");
  });

  test("normaliza o CNPJ do cliente do Brasil para dígitos", () => {
    const result = businessClientSchema.safeParse({
      name: "Cliente Nacional Ltda",
      origin: "domestic",
      document: VALID_CNPJ,
    });

    expect(result.success && result.data.document).toBe("11444777000161");
  });

  test("rejeita cliente do Brasil sem CNPJ", () => {
    const result = businessClientSchema.safeParse({
      name: "Cliente Nacional Ltda",
      origin: "domestic",
    });

    expect(result.success).toBe(false);
  });

  test("rejeita cliente do Brasil com CNPJ inválido", () => {
    const result = businessClientSchema.safeParse({
      name: "Cliente Nacional Ltda",
      origin: "domestic",
      document: "11444777000162",
    });

    expect(result.success).toBe(false);
  });

  test("aceita cliente do exterior sem documento (ID estrangeiro é opcional)", () => {
    const result = businessClientSchema.safeParse({
      name: "Acme Inc",
      origin: "foreign",
      country: "US",
    });

    expect(result.success).toBe(true);
  });

  test("aceita cliente do exterior com país e assume USD por padrão", () => {
    const result = businessClientSchema.safeParse({
      name: "Acme Inc",
      origin: "foreign",
      country: "US",
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.default_currency).toBe("USD");
  });

  test("normaliza país para maiúsculas", () => {
    const result = businessClientSchema.safeParse({
      name: "Acme Inc",
      origin: "foreign",
      country: "us",
    });

    expect(result.success && result.data.country).toBe("US");
  });

  test("rejeita cliente do exterior sem país", () => {
    const result = businessClientSchema.safeParse({
      name: "Acme Inc",
      origin: "foreign",
    });

    expect(result.success).toBe(false);
  });

  test("rejeita país com mais de 2 letras", () => {
    const result = businessClientSchema.safeParse({
      name: "Acme Inc",
      origin: "foreign",
      country: "USA",
    });

    expect(result.success).toBe(false);
  });

  test("rejeita cliente do Brasil com moeda USD", () => {
    const result = businessClientSchema.safeParse({
      name: "Cliente Nacional Ltda",
      origin: "domestic",
      default_currency: "USD",
    });

    expect(result.success).toBe(false);
  });

  test("rejeita nome vazio", () => {
    expect(
      businessClientSchema.safeParse({ name: "", origin: "domestic" }).success,
    ).toBe(false);
  });
});

describe("ptaxDateSchema", () => {
  test("aceita data passada no formato YYYY-MM-DD", () => {
    expect(ptaxDateSchema.safeParse(PAST_DATE).success).toBe(true);
  });

  test("rejeita formato DD/MM/AAAA", () => {
    expect(ptaxDateSchema.safeParse("16/10/2026").success).toBe(false);
  });

  test("rejeita data inexistente", () => {
    expect(ptaxDateSchema.safeParse("2026-02-30").success).toBe(false);
  });

  test("rejeita data futura", () => {
    expect(ptaxDateSchema.safeParse(FUTURE_DATE).success).toBe(false);
  });

  test("rejeita ausência de data", () => {
    expect(ptaxDateSchema.safeParse(undefined).success).toBe(false);
  });
});

describe("businessReceiptSchema", () => {
  const validBrl = {
    client_id: CLIENT_ID,
    received_on: PAST_DATE,
    currency: "BRL",
    amount_original: 1500,
    amount_brl: 1500,
  };

  const validUsd = {
    client_id: CLIENT_ID,
    received_on: PAST_DATE,
    currency: "USD",
    amount_original: 1000,
    exchange_rate: 5.4321,
    amount_brl: 5432.1,
    ptax_rate: 5.4,
  };

  test("aceita recebimento em BRL sem cotação", () => {
    expect(businessReceiptSchema.safeParse(validBrl).success).toBe(true);
  });

  test("rejeita BRL com cotação informada", () => {
    expect(
      businessReceiptSchema.safeParse({ ...validBrl, exchange_rate: 5 })
        .success,
    ).toBe(false);
  });

  test("rejeita BRL com valor em BRL diferente do original", () => {
    expect(
      businessReceiptSchema.safeParse({ ...validBrl, amount_brl: 1400 })
        .success,
    ).toBe(false);
  });

  test("aceita recebimento em USD com cotação e PTAX de referência", () => {
    const result = businessReceiptSchema.safeParse(validUsd);

    expect(result.success).toBe(true);
    expect(result.success && result.data.ptax_rate).toBe(5.4);
  });

  test("aceita PTAX de referência ausente (API do BCB pode falhar)", () => {
    expect(
      businessReceiptSchema.safeParse({ ...validUsd, ptax_rate: undefined })
        .success,
    ).toBe(true);
  });

  test("rejeita USD sem cotação", () => {
    expect(
      businessReceiptSchema.safeParse({ ...validUsd, exchange_rate: undefined })
        .success,
    ).toBe(false);
  });

  test("rejeita USD com cotação zero", () => {
    expect(
      businessReceiptSchema.safeParse({ ...validUsd, exchange_rate: 0 }).success,
    ).toBe(false);
  });

  test("rejeita valor original zero", () => {
    expect(
      businessReceiptSchema.safeParse({ ...validBrl, amount_original: 0 })
        .success,
    ).toBe(false);
  });

  test("rejeita valor em BRL zero", () => {
    expect(
      businessReceiptSchema.safeParse({
        ...validUsd,
        amount_brl: 0,
      }).success,
    ).toBe(false);
  });

  test("rejeita data inexistente (30 de fevereiro)", () => {
    expect(
      businessReceiptSchema.safeParse({ ...validBrl, received_on: "2026-02-30" })
        .success,
    ).toBe(false);
  });

  test("rejeita data em formato diferente de YYYY-MM-DD", () => {
    expect(
      businessReceiptSchema.safeParse({ ...validBrl, received_on: "16/10/2026" })
        .success,
    ).toBe(false);
  });

  test("rejeita data futura com status recebido", () => {
    expect(
      businessReceiptSchema.safeParse({
        ...validBrl,
        received_on: FUTURE_DATE,
        status: "received",
      }).success,
    ).toBe(false);
  });

  test("aceita data futura quando o status é previsto", () => {
    expect(
      businessReceiptSchema.safeParse({
        ...validBrl,
        received_on: FUTURE_DATE,
        status: "expected",
      }).success,
    ).toBe(true);
  });

  test("rejeita moeda fora de BRL e USD", () => {
    expect(
      businessReceiptSchema.safeParse({ ...validBrl, currency: "EUR" }).success,
    ).toBe(false);
  });
});
