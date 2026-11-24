import { describe, expect, test } from "vitest";
import { CARDS_TABS, DEFAULT_CARDS_TAB, parseCardsTab } from "./cards-tabs";

describe("parseCardsTab", () => {
  test("aceita cada uma das 4 abas do módulo", () => {
    CARDS_TABS.forEach((tab) => {
      expect(parseCardsTab(tab.id)).toBe(tab.id);
    });
  });

  test("cai em 'resumo' quando o parâmetro não existe", () => {
    expect(parseCardsTab(null)).toBe(DEFAULT_CARDS_TAB);
    expect(parseCardsTab(undefined)).toBe("resumo");
  });

  test("cai em 'resumo' quando o parâmetro é inválido", () => {
    expect(parseCardsTab("qualquer-coisa")).toBe("resumo");
    expect(parseCardsTab("")).toBe("resumo");
    expect(parseCardsTab("RESUMO")).toBe("resumo");
  });
});
