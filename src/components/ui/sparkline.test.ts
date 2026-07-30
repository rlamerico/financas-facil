import { describe, expect, test } from "vitest";
import { buildSparklineAreaPoints, buildSparklinePoints } from "./sparkline";

describe("buildSparklinePoints", () => {
  test("retorna string vazia para lista vazia", () => {
    expect(buildSparklinePoints([], 100, 40)).toBe("");
  });

  test("centraliza a linha verticalmente para um único valor", () => {
    const points = buildSparklinePoints([42], 100, 40);

    expect(points).toBe("0,20 100,20");
  });

  test("gera um ponto por valor", () => {
    const points = buildSparklinePoints([1, 2, 3, 4], 90, 30);

    expect(points.split(" ")).toHaveLength(4);
  });

  test("mapeia o menor valor para o fundo (y = height) e o maior pro topo (y = 0)", () => {
    const points = buildSparklinePoints([0, 10], 100, 50).split(" ");
    const [, firstY] = points[0].split(",").map(Number);
    const [, secondY] = points[1].split(",").map(Number);

    expect(firstY).toBeCloseTo(50);
    expect(secondY).toBeCloseTo(0);
  });

  test("não gera NaN quando todos os valores são iguais (range zero)", () => {
    const points = buildSparklinePoints([5, 5, 5], 60, 20);

    expect(points).not.toContain("NaN");
  });
});

describe("buildSparklineAreaPoints", () => {
  test("retorna string vazia para lista vazia", () => {
    expect(buildSparklineAreaPoints([], 100, 40)).toBe("");
  });

  test("fecha o polígono nos dois cantos inferiores", () => {
    const area = buildSparklineAreaPoints([0, 10], 100, 50).split(" ");
    const line = buildSparklinePoints([0, 10], 100, 50).split(" ");

    expect(area).toHaveLength(line.length + 2);
    expect(area.at(-2)).toBe("100,50");
    expect(area.at(-1)).toBe("0,50");
  });

  test("começa com os mesmos pontos da linha", () => {
    const area = buildSparklineAreaPoints([1, 2, 3], 90, 30);
    const line = buildSparklinePoints([1, 2, 3], 90, 30);

    expect(area.startsWith(line)).toBe(true);
  });
});
