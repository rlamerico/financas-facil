import { describe, expect, test } from "vitest";
import {
  normalizeCardName,
  normalizeCategoryLabel,
  normalizeHeader,
  normalizeLastFour,
  parseBrlAmount,
  parsePositiveNumber,
  parsePurchaseDate,
  parseSheetPeriod,
} from "./normalize";

describe("normalizeHeader", () => {
  test("sobe para maiúsculo, tira acento e colapsa espaços", () => {
    expect(normalizeHeader("Data de Compra")).toBe("DATA DE COMPRA");
    expect(normalizeHeader(" Descrição ")).toBe("DESCRICAO");
    expect(normalizeHeader("Cotação  (em R$)")).toBe("COTACAO (EM R$)");
  });

  test("distingue a coluna em reais da coluna em dólar", () => {
    expect(normalizeHeader("Valor (em R$)")).toBe("VALOR (EM R$)");
    expect(normalizeHeader("Valor (em US$)")).toBe("VALOR (EM US$)");
  });
});

describe("normalizeCardName", () => {
  test("troca hífen e underscore por espaço e colapsa", () => {
    expect(normalizeCardName("UBER-IEDA")).toBe("UBER IEDA");
    expect(normalizeCardName("rodrigo_americo")).toBe("RODRIGO AMERICO");
    expect(normalizeCardName("Rodrigo  C6   Ieda")).toBe("RODRIGO C6 IEDA");
  });

  test("remove acento para que apelidos casem entre abas", () => {
    expect(normalizeCardName("Virgínia Ferreira")).toBe("VIRGINIA FERREIRA");
  });

  test("devolve string vazia para valores ausentes", () => {
    expect(normalizeCardName(null)).toBe("");
    expect(normalizeCardName(undefined)).toBe("");
  });
});

describe("normalizeLastFour", () => {
  test("aceita o final do cartão vindo como number", () => {
    expect(normalizeLastFour(3783)).toBe("3783");
  });

  test("descarta o sufixo decimal que o Excel às vezes anexa", () => {
    expect(normalizeLastFour("3783.0")).toBe("3783");
    expect(normalizeLastFour("3783,00")).toBe("3783");
  });

  test("não confunde separador de milhar com fração zerada", () => {
    expect(normalizeLastFour("1.953")).toBe("1953");
  });

  test("completa com zero à esquerda quando vêm menos de 4 dígitos", () => {
    expect(normalizeLastFour(53)).toBe("0053");
  });

  test("fica com os 4 últimos dígitos quando vem o cartão inteiro", () => {
    expect(normalizeLastFour("4111 1111 1111 3783")).toBe("3783");
  });
});

describe("normalizeCategoryLabel", () => {
  test('trata "-", vazio e null como ausência de categoria', () => {
    expect(normalizeCategoryLabel("-")).toBeNull();
    expect(normalizeCategoryLabel("")).toBeNull();
    expect(normalizeCategoryLabel("   ")).toBeNull();
    expect(normalizeCategoryLabel(null)).toBeNull();
  });

  test("preserva o rótulo da operadora, só aparando espaços", () => {
    expect(normalizeCategoryLabel(" Educacional ")).toBe("Educacional");
  });
});

describe("parsePurchaseDate", () => {
  test("converte Date da planilha para ISO usando o calendário local do SheetJS", () => {
    expect(parsePurchaseDate(new Date(2025, 9, 14))).toBe("2025-10-14");
  });

  test("lê data em string no formato dd/mm/aaaa, não mm/dd/aaaa", () => {
    expect(parsePurchaseDate("14/10/2025")).toBe("2025-10-14");
    expect(parsePurchaseDate("21/04/2026")).toBe("2026-04-21");
    expect(parsePurchaseDate("01/02/2026")).toBe("2026-02-01");
  });

  test("aceita ano de 2 dígitos", () => {
    expect(parsePurchaseDate("14/10/25")).toBe("2025-10-14");
  });

  test("devolve null para data ausente ou impossível", () => {
    expect(parsePurchaseDate(null)).toBeNull();
    expect(parsePurchaseDate("")).toBeNull();
    expect(parsePurchaseDate("32/01/2026")).toBeNull();
    expect(parsePurchaseDate("14/13/2025")).toBeNull();
    expect(parsePurchaseDate("Adapta.Org")).toBeNull();
    expect(parsePurchaseDate(new Date("inválido"))).toBeNull();
  });
});

describe("parseBrlAmount", () => {
  test("aceita number direto, inclusive negativo", () => {
    expect(parseBrlAmount(9.49)).toBe(9.49);
    expect(parseBrlAmount(-120.5)).toBe(-120.5);
    expect(parseBrlAmount(0)).toBe(0);
  });

  test("recupera valor em string no formato BRL bem-formado", () => {
    expect(parseBrlAmount("R$ 9,49")).toBe(9.49);
    expect(parseBrlAmount("1.234,56")).toBe(1234.56);
    expect(parseBrlAmount("-R$ 1.234,56")).toBe(-1234.56);
  });

  test("rejeita string ambígua em vez de adivinhar o valor", () => {
    // Duas vírgulas: não dá para saber se é 45.972,00 ou 45,97.
    expect(parseBrlAmount("R$ 45,972,00")).toBeNull();
    expect(parseBrlAmount("R$ 46,333,00")).toBeNull();
    expect(parseBrlAmount("9,4")).toBeNull();
    expect(parseBrlAmount("1234,56")).toBeNull();
    expect(parseBrlAmount("abc")).toBeNull();
  });

  test("devolve null para valor ausente", () => {
    expect(parseBrlAmount(null)).toBeNull();
    expect(parseBrlAmount(undefined)).toBeNull();
    expect(parseBrlAmount("")).toBeNull();
  });
});

describe("parsePositiveNumber", () => {
  test("zera as colunas de câmbio quando a compra foi em BRL", () => {
    expect(parsePositiveNumber(0)).toBeNull();
    expect(parsePositiveNumber(null)).toBeNull();
    expect(parsePositiveNumber(undefined)).toBeNull();
  });

  test("preserva cotação e valor em dólar quando existem", () => {
    expect(parsePositiveNumber(12.34)).toBe(12.34);
    expect(parsePositiveNumber("5,40")).toBe(5.4);
  });
});

describe("parseSheetPeriod", () => {
  test("lê mês e ano de 4 dígitos", () => {
    expect(parseSheetPeriod("Fevereiro 2026")).toEqual({
      referenceMonth: 2,
      referenceYear: 2026,
    });
  });

  test("expande ano de 2 dígitos", () => {
    expect(parseSheetPeriod("Janeiro 26")).toEqual({ referenceMonth: 1, referenceYear: 2026 });
  });

  test("não chuta o ano quando a aba não traz um", () => {
    expect(parseSheetPeriod("Agosto")).toEqual({ referenceMonth: 8, referenceYear: null });
  });

  test("ignora acento no nome do mês", () => {
    expect(parseSheetPeriod("Março 2026")).toEqual({ referenceMonth: 3, referenceYear: 2026 });
  });

  test("devolve null quando não há mês reconhecível", () => {
    expect(parseSheetPeriod("Resumo Cartões")).toBeNull();
    expect(parseSheetPeriod("Planilha1")).toBeNull();
  });
});
