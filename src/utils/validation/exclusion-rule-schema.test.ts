import { describe, expect, test } from "vitest";
import { exclusionRuleSchema } from "./exclusion-rule-schema";

const CARD_UUID = "3f1a6c2e-9b7d-4c1e-8a2f-5d6e7f8a9b0c";

describe("exclusionRuleSchema", () => {
  const validInput = {
    name: "Pagamento de fatura",
    match_type: "description_contains" as const,
    match_value: "INCLUSAO DE PAGAMENTO",
    card_id: null,
    is_active: true,
  };

  test("aceita regra de texto completa", () => {
    expect(exclusionRuleSchema.safeParse(validInput).success).toBe(true);
  });

  test("aceita card_id uuid (regra de um cartão só)", () => {
    const result = exclusionRuleSchema.safeParse({
      ...validInput,
      card_id: CARD_UUID,
    });

    expect(result.success).toBe(true);
  });

  test("rejeita card_id que não é uuid", () => {
    const result = exclusionRuleSchema.safeParse({
      ...validInput,
      card_id: "card-1",
    });

    expect(result.success).toBe(false);
  });

  test("aplica o trim ao nome e ao texto procurado", () => {
    const result = exclusionRuleSchema.safeParse({
      ...validInput,
      name: "  Estorno de tarifa  ",
      match_value: "  ESTORNO TARIFA  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Estorno de tarifa");
      expect(result.data.match_value).toBe("ESTORNO TARIFA");
    }
  });

  test("is_active vem true quando omitido", () => {
    const result = exclusionRuleSchema.safeParse({
      name: "Pagamento de fatura",
      match_type: "description_contains",
      match_value: "INCLUSAO DE PAGAMENTO",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_active).toBe(true);
    }
  });

  test("aceita negative_amount sem match_value", () => {
    const result = exclusionRuleSchema.safeParse({
      name: "Lançamentos negativos",
      match_type: "negative_amount",
      match_value: null,
      is_active: false,
    });

    expect(result.success).toBe(true);
  });

  test("rejeita regra de texto sem match_value", () => {
    const result = exclusionRuleSchema.safeParse({
      ...validInput,
      match_value: null,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["match_value"]);
      expect(result.error.issues[0].message).toBe("Informe o texto a procurar.");
    }
  });

  test("rejeita regra de texto com match_value só de espaços", () => {
    const result = exclusionRuleSchema.safeParse({
      ...validInput,
      match_value: "   ",
    });

    expect(result.success).toBe(false);
  });

  test("rejeita nome vazio", () => {
    const result = exclusionRuleSchema.safeParse({ ...validInput, name: "  " });

    expect(result.success).toBe(false);
  });

  test("rejeita match_type desconhecido", () => {
    const result = exclusionRuleSchema.safeParse({
      ...validInput,
      match_type: "regex",
    });

    expect(result.success).toBe(false);
  });
});
