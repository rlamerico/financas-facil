import { describe, expect, test } from "vitest";
import { buildFingerprint, buildFingerprintBase } from "./fingerprint";

const viasul = {
  purchaseDate: "2026-07-25",
  description: "VIASUL",
  amount: 6.6,
  cardLastFour: "3783",
  installmentCurrent: 1,
  installmentTotal: 1,
};

describe("buildFingerprint", () => {
  test("monta uma chave composta legível, não um hash", () => {
    expect(buildFingerprint(viasul, 2)).toBe("2026-07-25|VIASUL|6.60|3783|1/1|#2");
  });

  test("normaliza o valor com duas casas para não depender da representação do float", () => {
    expect(buildFingerprint({ ...viasul, amount: 6.6 }, 1)).toContain("|6.60|");
    expect(buildFingerprint({ ...viasul, amount: 1234 }, 1)).toContain("|1234.00|");
  });

  test("preserva o sinal de lançamentos negativos", () => {
    expect(buildFingerprint({ ...viasul, amount: -6.6 }, 1)).toContain("|-6.60|");
  });

  test("marca ausência de parcelamento sem inventar 1/1", () => {
    const semParcela = { ...viasul, installmentCurrent: null, installmentTotal: null };
    expect(buildFingerprint(semParcela, 1)).toBe("2026-07-25|VIASUL|6.60|3783|-|#1");
  });

  test("o índice de ocorrência é o que distingue duplicatas legítimas", () => {
    // 3 pedágios VIASUL no mesmo dia, mesmo valor: compras reais distintas.
    const chaves = [1, 2, 3].map((n) => buildFingerprint(viasul, n));
    expect(new Set(chaves).size).toBe(3);
  });

  test("a mesma entrada gera sempre a mesma chave (idempotência da reimportação)", () => {
    expect(buildFingerprint(viasul, 2)).toBe(buildFingerprint({ ...viasul }, 2));
  });
});

describe("buildFingerprintBase", () => {
  test("é a chave sem o índice, usada para contar ocorrências dentro da aba", () => {
    expect(buildFingerprintBase(viasul)).toBe("2026-07-25|VIASUL|6.60|3783|1/1");
    expect(buildFingerprint(viasul, 2)).toBe(`${buildFingerprintBase(viasul)}|#2`);
  });
});
