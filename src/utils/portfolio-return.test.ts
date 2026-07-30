import { describe, expect, test } from "vitest";
import { calculatePortfolioReturn } from "./portfolio-return";

describe("calculatePortfolioReturn", () => {
  test("retorna carteira vazia para nenhum investimento", () => {
    const result = calculatePortfolioReturn([]);

    expect(result.rows).toEqual([]);
    expect(result.totalInvestedValue).toBe(0);
    expect(result.totalCurrentValue).toBe(0);
    expect(result.totalGain).toBe(0);
    expect(result.totalReturnPercentage).toBeNull();
  });

  test("calcula valor investido, valor atual e rentabilidade de um ativo com cotação", () => {
    const result = calculatePortfolioReturn([
      {
        id: "inv-1",
        assetName: "Tesouro Selic",
        quantity: 10,
        averagePrice: 100,
        currentPrice: 110,
      },
    ]);

    expect(result.rows).toEqual([
      {
        id: "inv-1",
        assetName: "Tesouro Selic",
        investedValue: 1000,
        currentValue: 1100,
        gain: 100,
        returnPercentage: 10,
      },
    ]);
    expect(result.totalInvestedValue).toBe(1000);
    expect(result.totalCurrentValue).toBe(1100);
    expect(result.totalGain).toBe(100);
    expect(result.totalReturnPercentage).toBe(10);
  });

  test("ativo sem current_price fica com currentValue/gain/returnPercentage nulos", () => {
    const result = calculatePortfolioReturn([
      {
        id: "inv-1",
        assetName: "Ação XPTO",
        quantity: 5,
        averagePrice: 20,
        currentPrice: null,
      },
    ]);

    expect(result.rows[0].currentValue).toBeNull();
    expect(result.rows[0].gain).toBeNull();
    expect(result.rows[0].returnPercentage).toBeNull();
    // investedValue continua calculado mesmo sem cotação
    expect(result.rows[0].investedValue).toBe(100);
  });

  test("ativo sem cotação não conta como zero no valor total da carteira", () => {
    const result = calculatePortfolioReturn([
      {
        id: "inv-1",
        assetName: "Cotado",
        quantity: 10,
        averagePrice: 100,
        currentPrice: 120,
      },
      {
        id: "inv-2",
        assetName: "Sem cotação",
        quantity: 100,
        averagePrice: 50,
        currentPrice: null,
      },
    ]);

    // totalInvestedValue soma os dois (5000 + 1000), mas totalCurrentValue e
    // totalGain só consideram o ativo cotado — não tratam "sem cotação" como 0.
    expect(result.totalInvestedValue).toBe(6000);
    expect(result.totalCurrentValue).toBe(1200);
    expect(result.totalGain).toBe(200);
    expect(result.totalReturnPercentage).toBe(20);
  });

  test("calcula rentabilidade negativa quando preço atual caiu abaixo do médio", () => {
    const result = calculatePortfolioReturn([
      {
        id: "inv-1",
        assetName: "Cripto X",
        quantity: 2,
        averagePrice: 1000,
        currentPrice: 800,
      },
    ]);

    expect(result.rows[0].gain).toBe(-400);
    expect(result.rows[0].returnPercentage).toBe(-20);
    expect(result.totalGain).toBe(-400);
    expect(result.totalReturnPercentage).toBe(-20);
  });

  test("agrega múltiplos ativos cotados corretamente", () => {
    const result = calculatePortfolioReturn([
      {
        id: "inv-1",
        assetName: "A",
        quantity: 10,
        averagePrice: 10,
        currentPrice: 12,
      },
      {
        id: "inv-2",
        assetName: "B",
        quantity: 4,
        averagePrice: 50,
        currentPrice: 40,
      },
    ]);

    expect(result.totalInvestedValue).toBe(300);
    expect(result.totalCurrentValue).toBe(280);
    expect(result.totalGain).toBe(-20);
  });
});
