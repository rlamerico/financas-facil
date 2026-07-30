import { describe, expect, test } from "vitest";
import { bankAccountSchema } from "./bank-account-schema";

describe("bankAccountSchema", () => {
  const validInput = {
    name: "Conta Corrente Principal",
    bank_name: "Banco do Brasil",
    account_type: "Corrente",
    balance: 1500.5,
  };

  test("aceita dados válidos", () => {
    expect(bankAccountSchema.safeParse(validInput).success).toBe(true);
  });

  test("aceita bank_name e account_type nulos", () => {
    const result = bankAccountSchema.safeParse({
      ...validInput,
      bank_name: null,
      account_type: null,
    });

    expect(result.success).toBe(true);
  });

  test("aceita bank_name e account_type ausentes (opcionais)", () => {
    const withoutOptional: Partial<typeof validInput> = { ...validInput };
    delete withoutOptional.bank_name;
    delete withoutOptional.account_type;

    expect(bankAccountSchema.safeParse(withoutOptional).success).toBe(true);
  });

  test("aceita saldo negativo (conta no vermelho)", () => {
    const result = bankAccountSchema.safeParse({ ...validInput, balance: -50 });

    expect(result.success).toBe(true);
  });

  test("aceita saldo zero", () => {
    const result = bankAccountSchema.safeParse({ ...validInput, balance: 0 });

    expect(result.success).toBe(true);
  });

  test("rejeita nome vazio", () => {
    const result = bankAccountSchema.safeParse({ ...validInput, name: "" });

    expect(result.success).toBe(false);
  });

  test("rejeita saldo não numérico", () => {
    const result = bankAccountSchema.safeParse({
      ...validInput,
      balance: "não é número",
    });

    expect(result.success).toBe(false);
  });
});
