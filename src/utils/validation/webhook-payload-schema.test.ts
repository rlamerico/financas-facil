import { describe, expect, test } from "vitest";
import { webhookPayloadSchema } from "./webhook-payload-schema";

describe("webhookPayloadSchema", () => {
  const validInput = {
    profile_id: "123e4567-e89b-12d3-a456-426614174000",
    description: "Compra no débito - Supermercado",
    amount: -150.75,
    date: "2026-06-30",
  };

  test("aceita payload mínimo válido", () => {
    expect(webhookPayloadSchema.safeParse(validInput).success).toBe(true);
  });

  test("aceita amount positivo (crédito/receita)", () => {
    const result = webhookPayloadSchema.safeParse({
      ...validInput,
      amount: 2500,
    });

    expect(result.success).toBe(true);
  });

  test("aceita category_id e status opcionais", () => {
    const result = webhookPayloadSchema.safeParse({
      ...validInput,
      category_id: "223e4567-e89b-12d3-a456-426614174000",
      status: "pending",
    });

    expect(result.success).toBe(true);
  });

  test("aceita category_id nulo", () => {
    const result = webhookPayloadSchema.safeParse({
      ...validInput,
      category_id: null,
    });

    expect(result.success).toBe(true);
  });

  test("rejeita profile_id que não é UUID", () => {
    const result = webhookPayloadSchema.safeParse({
      ...validInput,
      profile_id: "not-a-uuid",
    });

    expect(result.success).toBe(false);
  });

  test("rejeita descrição vazia", () => {
    const result = webhookPayloadSchema.safeParse({
      ...validInput,
      description: "   ",
    });

    expect(result.success).toBe(false);
  });

  test("rejeita amount zero", () => {
    const result = webhookPayloadSchema.safeParse({ ...validInput, amount: 0 });

    expect(result.success).toBe(false);
  });

  test("rejeita status fora do enum", () => {
    const result = webhookPayloadSchema.safeParse({
      ...validInput,
      status: "cancelled",
    });

    expect(result.success).toBe(false);
  });

  test("rejeita quando faltam campos obrigatórios", () => {
    const withoutDescription: Partial<typeof validInput> = { ...validInput };
    delete withoutDescription.description;

    expect(webhookPayloadSchema.safeParse(withoutDescription).success).toBe(
      false,
    );
  });
});
