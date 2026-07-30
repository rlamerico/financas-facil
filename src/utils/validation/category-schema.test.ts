import { describe, expect, test } from "vitest";
import { categorySchema } from "./category-schema";

describe("categorySchema", () => {
  const validInput = {
    name: "Assinaturas",
    type: "expense" as const,
    color: "#2E7D32",
    icon: "Tv",
  };

  test("aceita dados válidos", () => {
    expect(categorySchema.safeParse(validInput).success).toBe(true);
  });

  test("aceita color e icon nulos", () => {
    const result = categorySchema.safeParse({
      ...validInput,
      color: null,
      icon: null,
    });

    expect(result.success).toBe(true);
  });

  test("aceita color e icon ausentes", () => {
    const result = categorySchema.safeParse({
      name: "Assinaturas",
      type: "expense",
    });

    expect(result.success).toBe(true);
  });

  test("rejeita nome vazio", () => {
    const result = categorySchema.safeParse({ ...validInput, name: "  " });

    expect(result.success).toBe(false);
  });

  test("rejeita tipo inválido", () => {
    const result = categorySchema.safeParse({
      ...validInput,
      type: "transfer",
    });

    expect(result.success).toBe(false);
  });
});
