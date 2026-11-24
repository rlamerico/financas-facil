import { describe, expect, test } from "vitest";
import {
  CARD_GROUPS,
  cardAliasSchema,
  creditCardSchema,
} from "./credit-card-schema";

/** Base válida — cada teste altera só o campo que está sob exame. */
const VALID = {
  name: "Rodrigo C6 Ieda",
  last_four: "3783",
  issuer: "C6 Bank",
  holder_label: "Ieda",
  card_group: "pessoal" as const,
  color: "#2E7D32",
};

function firstMessage(input: unknown): string | undefined {
  const result = creditCardSchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe("creditCardSchema", () => {
  test("aceita um cartão completo", () => {
    // Arrange / Act
    const result = creditCardSchema.safeParse(VALID);

    // Assert
    expect(result.success).toBe(true);
  });

  test("aceita cartão só com os campos obrigatórios", () => {
    const result = creditCardSchema.safeParse({
      name: "RPA SOLUCOES",
      last_four: "4281",
      card_group: "empresa",
    });

    expect(result.success).toBe(true);
  });

  test("apara espaços do nome e do final", () => {
    const result = creditCardSchema.safeParse({
      ...VALID,
      name: "  Rodrigo C6 Ieda  ",
      last_four: " 3783 ",
    });

    expect(result.success && result.data.name).toBe("Rodrigo C6 Ieda");
    expect(result.success && result.data.last_four).toBe("3783");
  });

  test("nome vazio é rejeitado com mensagem em português", () => {
    expect(firstMessage({ ...VALID, name: "   " })).toBe(
      "Informe o nome do cartão.",
    );
  });

  test.each(["378", "37833", "37a3", ""])(
    "final inválido (%s) é rejeitado",
    (lastFour) => {
      expect(firstMessage({ ...VALID, last_four: lastFour })).toBe(
        "Informe os 4 últimos dígitos.",
      );
    },
  );

  test("os 11 finais reais da planilha são aceitos", () => {
    // Arrange
    const realLastFours = [
      "4281",
      "3783",
      "3355",
      "9940",
      "9498",
      "9388",
      "3103",
      "1953",
      "2407",
      "6160",
      "3613",
    ];

    // Act / Assert
    for (const lastFour of realLastFours) {
      expect(
        creditCardSchema.safeParse({ ...VALID, last_four: lastFour }).success,
      ).toBe(true);
    }
  });

  test("grupo fora de pessoal/empresa é rejeitado", () => {
    expect(
      creditCardSchema.safeParse({ ...VALID, card_group: "familia" }).success,
    ).toBe(false);
  });

  test("issuer e holder_label aceitam null", () => {
    const result = creditCardSchema.safeParse({
      ...VALID,
      issuer: null,
      holder_label: null,
      color: null,
    });

    expect(result.success).toBe(true);
  });
});

describe("CARD_GROUPS", () => {
  test("expõe exatamente os dois grupos do CHECK da migration", () => {
    expect(CARD_GROUPS.map((group) => group.value)).toEqual([
      "pessoal",
      "empresa",
    ]);
  });
});

describe("cardAliasSchema", () => {
  test("aceita um apelido com conteúdo", () => {
    expect(cardAliasSchema.safeParse({ alias: "UBER-IEDA" }).success).toBe(
      true,
    );
  });

  test("apelido só de espaços é rejeitado", () => {
    const result = cardAliasSchema.safeParse({ alias: "   " });

    expect(result.success).toBe(false);
    expect(!result.success && result.error.issues[0].message).toBe(
      "Informe o apelido.",
    );
  });
});
