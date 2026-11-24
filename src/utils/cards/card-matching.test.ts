import { describe, expect, test } from "vitest";
import {
  normalizeCardName,
  resolveCardByEntry,
  type MatchableCard,
} from "./card-matching";

/** Os 7 nomes que o mesmo adicional da Ieda assume ao longo da planilha real. */
const IEDA_ALIASES = [
  "RA-IEDA",
  "RODRIGO AMERICO IEDA",
  "RODRIGO AMERICO-IEDA",
  "RPA IEDA",
  "Rodrigo C6 Ieda",
  "UBER-IEDA",
  "Uber Ieda",
];

const IEDA: MatchableCard = {
  id: "card-ieda",
  name: "Rodrigo C6 Ieda",
  last_four: "3783",
  aliases: IEDA_ALIASES.map(normalizeCardName),
};

const RPA: MatchableCard = {
  id: "card-rpa",
  name: "RPA SOLUCOES",
  last_four: "4281",
  aliases: [normalizeCardName("RPA SOLUCOES")],
};

const CARDS = [IEDA, RPA];

describe("normalizeCardName", () => {
  test("colapsa maiúsculas, hífen e espaço extra na mesma string", () => {
    // Arrange
    const variants = [
      "Rodrigo C6 Ieda",
      "RODRIGO-C6-IEDA",
      "  rodrigo  c6  ieda ",
    ];

    // Act
    const normalized = variants.map(normalizeCardName);

    // Assert
    expect(new Set(normalized).size).toBe(1);
    expect(normalized[0]).toBe("RODRIGO C6 IEDA");
  });

  test("remove acento do nome do cartão", () => {
    expect(normalizeCardName("Virgínia Ferreira")).toBe("VIRGINIA FERREIRA");
  });

  test("os 7 apelidos reais da Ieda colapsam em 5 chaves distintas", () => {
    // Arrange / Act
    const keys = new Set(IEDA_ALIASES.map(normalizeCardName));

    // Assert — "RODRIGO AMERICO IEDA"/"RODRIGO AMERICO-IEDA" e "UBER-IEDA"/"Uber
    // Ieda" viram o mesmo apelido; as outras 5 formas seguem distintas.
    expect([...keys].sort()).toEqual([
      "RA IEDA",
      "RODRIGO AMERICO IEDA",
      "RODRIGO C6 IEDA",
      "RPA IEDA",
      "UBER IEDA",
    ]);
  });

  test("valores ausentes viram string vazia em vez de quebrar", () => {
    expect(normalizeCardName("")).toBe("");
    expect(normalizeCardName(null)).toBe("");
  });
});

describe("resolveCardByEntry", () => {
  test("casa pelo final do cartão", () => {
    // Arrange / Act
    const match = resolveCardByEntry(CARDS, {
      cardLastFour: "3783",
      cardNameNormalized: "RODRIGO AMERICO IEDA",
    });

    // Assert
    expect(match).toEqual({ card: IEDA, matchedBy: "last_four" });
  });

  test("final correto vence nome divergente", () => {
    // Arrange — o nome é o do cartão da empresa, mas o final é o da Ieda.
    const entry = { cardLastFour: "3783", cardNameNormalized: "RPA SOLUCOES" };

    // Act
    const match = resolveCardByEntry(CARDS, entry);

    // Assert
    expect(match?.card.id).toBe("card-ieda");
    expect(match?.matchedBy).toBe("last_four");
  });

  test("cai no apelido quando o final não está cadastrado", () => {
    // Arrange / Act
    const match = resolveCardByEntry(CARDS, {
      cardLastFour: "0000",
      cardNameNormalized: "UBER-IEDA",
    });

    // Assert
    expect(match).toEqual({ card: IEDA, matchedBy: "alias" });
  });

  test("casa por apelido quando o final vem vazio", () => {
    const match = resolveCardByEntry(CARDS, {
      cardLastFour: "",
      cardNameNormalized: "  rpa  solucoes ",
    });

    expect(match).toEqual({ card: RPA, matchedBy: "alias" });
  });

  test("aceita o final vindo do Excel como '3783.0'", () => {
    const match = resolveCardByEntry(CARDS, {
      cardLastFour: "3783.0",
      cardNameNormalized: "",
    });

    expect(match?.matchedBy).toBe("last_four");
  });

  test("devolve null quando nem final nem apelido são conhecidos", () => {
    const match = resolveCardByEntry(CARDS, {
      cardLastFour: "9999",
      cardNameNormalized: "CARTAO DESCONHECIDO",
    });

    expect(match).toBeNull();
  });

  test("devolve null quando a lista de cartões está vazia", () => {
    expect(
      resolveCardByEntry([], {
        cardLastFour: "3783",
        cardNameNormalized: "IEDA",
      }),
    ).toBeNull();
  });
});
