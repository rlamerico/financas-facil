import { describe, expect, test } from "vitest";
import {
  applyExclusionRules,
  evaluateExclusion,
  normalizeText,
  type EvaluableEntry,
  type ExclusionRule,
} from "./exclusion-rules";

function makeRule(overrides: Partial<ExclusionRule> = {}): ExclusionRule {
  return {
    id: "rule-1",
    name: "Pagamento de fatura",
    match_type: "description_contains",
    match_value: "INCLUSAO DE PAGAMENTO",
    card_id: null,
    is_active: true,
    ...overrides,
  };
}

function makeEntry(overrides: Partial<EvaluableEntry> = {}): EvaluableEntry {
  return {
    description: "Padaria do Bairro",
    categoryLabel: "Alimentação",
    amount: 42.5,
    cardId: "card-1",
    ...overrides,
  };
}

describe("normalizeText", () => {
  test("põe em maiúsculo, tira acento, colapsa espaços e apara as pontas", () => {
    expect(normalizeText("  Inclusão   de  Pagamento  ")).toBe(
      "INCLUSAO DE PAGAMENTO",
    );
  });

  test("trata null e undefined como texto vazio", () => {
    expect(normalizeText(null)).toBe("");
    expect(normalizeText(undefined)).toBe("");
  });
});

describe("evaluateExclusion", () => {
  test("casa descrição com espaços à direita, como vem da planilha", () => {
    const entry = makeEntry({ description: "Inclusao de Pagamento    " });
    const rules = [makeRule()];

    const match = evaluateExclusion(entry, rules);

    expect(match).toEqual({
      ruleId: "rule-1",
      ruleName: "Pagamento de fatura",
      reason: "Regra: Pagamento de fatura",
    });
  });

  test("não casa 'PAGAMENTO*CLINICA DE E' — é compra legítima, não pagamento de fatura", () => {
    const entry = makeEntry({ description: "PAGAMENTO*CLINICA DE E" });
    const rules = [makeRule()];

    expect(evaluateExclusion(entry, rules)).toBeNull();
  });

  test("casa mesmo com acento e caixa diferentes entre regra e lançamento", () => {
    const entry = makeEntry({ description: "estorno tarifá anuidade" });
    const rules = [makeRule({ match_value: "Estorno Tarifa" })];

    expect(evaluateExclusion(entry, rules)?.ruleId).toBe("rule-1");
  });

  test("regra com card_id só afeta lançamentos daquele cartão", () => {
    const rules = [makeRule({ card_id: "card-1" })];
    const doCartao = makeEntry({
      description: "Inclusao de Pagamento",
      cardId: "card-1",
    });
    const deOutroCartao = makeEntry({
      description: "Inclusao de Pagamento",
      cardId: "card-2",
    });

    expect(evaluateExclusion(doCartao, rules)?.ruleId).toBe("rule-1");
    expect(evaluateExclusion(deOutroCartao, rules)).toBeNull();
  });

  test("regra sem card_id vale para qualquer cartão", () => {
    const rules = [makeRule({ card_id: null })];
    const entry = makeEntry({
      description: "Inclusao de Pagamento",
      cardId: "card-99",
    });

    expect(evaluateExclusion(entry, rules)?.ruleId).toBe("rule-1");
  });

  test("regra desativada nunca casa", () => {
    const entry = makeEntry({ description: "Inclusao de Pagamento" });
    const rules = [makeRule({ is_active: false })];

    expect(evaluateExclusion(entry, rules)).toBeNull();
  });

  test("category_equals exige igualdade, não substring", () => {
    const rules = [
      makeRule({ match_type: "category_equals", match_value: "Tarifas" }),
    ];

    expect(
      evaluateExclusion(makeEntry({ categoryLabel: "tarifas" }), rules)?.ruleId,
    ).toBe("rule-1");
    expect(
      evaluateExclusion(makeEntry({ categoryLabel: "Tarifas bancárias" }), rules),
    ).toBeNull();
  });

  test("category_equals não casa lançamento sem categoria", () => {
    const rules = [
      makeRule({ match_type: "category_equals", match_value: "Tarifas" }),
    ];

    expect(evaluateExclusion(makeEntry({ categoryLabel: null }), rules)).toBeNull();
  });

  test("negative_amount casa só valor abaixo de zero", () => {
    const rules = [
      makeRule({ match_type: "negative_amount", match_value: null }),
    ];

    expect(evaluateExclusion(makeEntry({ amount: -10 }), rules)?.ruleId).toBe(
      "rule-1",
    );
    expect(evaluateExclusion(makeEntry({ amount: 0 }), rules)).toBeNull();
    expect(evaluateExclusion(makeEntry({ amount: 10 }), rules)).toBeNull();
  });

  test("regra de texto com match_value vazio não vira curinga", () => {
    const rules = [makeRule({ match_value: "   " })];

    expect(evaluateExclusion(makeEntry(), rules)).toBeNull();
  });

  test("com duas regras casando, vence a primeira da lista", () => {
    const entry = makeEntry({ description: "Inclusao de Pagamento", amount: -100 });
    const rules = [
      makeRule({ id: "rule-neg", name: "Negativos", match_type: "negative_amount", match_value: null }),
      makeRule({ id: "rule-pag", name: "Pagamento de fatura" }),
    ];

    expect(evaluateExclusion(entry, rules)?.ruleId).toBe("rule-neg");
  });

  test("sem regras, nada é excluído", () => {
    expect(evaluateExclusion(makeEntry(), [])).toBeNull();
  });
});

describe("applyExclusionRules", () => {
  test("anota cada lançamento com o resultado da avaliação", () => {
    const entries = [
      makeEntry({ description: "Inclusao de Pagamento    " }),
      makeEntry({ description: "PAGAMENTO*CLINICA DE E" }),
    ];

    const result = applyExclusionRules(entries, [makeRule()]);

    expect(result[0]).toMatchObject({
      isExcluded: true,
      exclusionRuleId: "rule-1",
      exclusionReason: "Regra: Pagamento de fatura",
    });
    expect(result[1]).toMatchObject({
      isExcluded: false,
      exclusionRuleId: null,
      exclusionReason: null,
    });
  });

  test("não muta o array nem os objetos de entrada", () => {
    const entry = makeEntry({ description: "Inclusao de Pagamento" });
    const entries = [entry];
    const snapshot = { ...entry };

    const result = applyExclusionRules(entries, [makeRule()]);

    expect(result).not.toBe(entries);
    expect(result[0]).not.toBe(entry);
    expect(entry).toEqual(snapshot);
    expect(entries).toHaveLength(1);
  });

  test("preserva os campos extras do lançamento original", () => {
    const entries = [{ ...makeEntry(), fingerprint: "abc123", rowNumber: 7 }];

    const result = applyExclusionRules(entries, [makeRule()]);

    expect(result[0].fingerprint).toBe("abc123");
    expect(result[0].rowNumber).toBe(7);
  });

  test("lista vazia devolve lista vazia", () => {
    expect(applyExclusionRules([], [makeRule()])).toEqual([]);
  });
});
