import { describe, expect, test } from "vitest";
import { decodeInstallment } from "./installments";

describe("decodeInstallment", () => {
  test('trata "Única" (em qualquer caixa) como parcela 1 de 1', () => {
    for (const raw of ["Única", "UNICA", "unica", "ÚNICA", " única "]) {
      expect(decodeInstallment(raw)).toEqual({ current: 1, total: 1, raw: raw.trim() });
    }
  });

  test("decodifica parcela corrompida pelo Excel em Date: dia = parcela, mês = total", () => {
    // "6/10" virou 2025-10-06 sob locale pt-BR; a regra reversa devolve 6 de 10.
    expect(decodeInstallment(new Date(2025, 9, 6))).toEqual({
      current: 6,
      total: 10,
      raw: "2025-10-06",
    });
  });

  test("decodifica serial do Excel vindo como string", () => {
    // 46082 = 2026-03-01 -> parcela 1 de 3
    expect(decodeInstallment("46082")).toEqual({ current: 1, total: 3, raw: "46082" });
  });

  test("decodifica serial do Excel vindo como number", () => {
    expect(decodeInstallment(46082)).toEqual({ current: 1, total: 3, raw: "46082" });
  });

  test('mantém "1/14" como texto, porque o Excel não corrompe mais de 12 parcelas', () => {
    expect(decodeInstallment("1/14")).toEqual({ current: 1, total: 14, raw: "1/14" });
  });

  test('decodifica "12/12" como última de doze', () => {
    expect(decodeInstallment("12/12")).toEqual({ current: 12, total: 12, raw: "12/12" });
  });

  test("devolve nulos para vazio, null e traço", () => {
    expect(decodeInstallment(null)).toEqual({ current: null, total: null, raw: null });
    expect(decodeInstallment(undefined)).toEqual({ current: null, total: null, raw: null });
    expect(decodeInstallment("")).toEqual({ current: null, total: null, raw: null });
    expect(decodeInstallment("   ")).toEqual({ current: null, total: null, raw: null });
    expect(decodeInstallment("-")).toEqual({ current: null, total: null, raw: "-" });
  });

  test("preserva o original em raw quando não consegue decodificar", () => {
    expect(decodeInstallment("lixo")).toEqual({ current: null, total: null, raw: "lixo" });
  });

  test("o serial é lido em UTC, então não escorrega de dia por fuso", () => {
    // 46083 = 2026-03-02 em UTC; leitura local poderia devolver 1/3 em fusos negativos.
    expect(decodeInstallment("46083")).toEqual({ current: 2, total: 3, raw: "46083" });
  });

  test("rejeita seriais e frações fora de faixa em vez de inventar parcela", () => {
    expect(decodeInstallment("0/0")).toEqual({ current: null, total: null, raw: "0/0" });
    expect(decodeInstallment(0)).toEqual({ current: null, total: null, raw: "0" });
    expect(decodeInstallment(Number.NaN)).toEqual({ current: null, total: null, raw: null });
  });
});
