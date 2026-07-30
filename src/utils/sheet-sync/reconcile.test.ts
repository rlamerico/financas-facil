import { describe, expect, test } from "vitest";
import {
  buildDescription,
  diffTransactions,
  normalizeCategoryName,
  resolveTransactionDate,
  type DesiredTransaction,
  type ExistingTransaction,
} from "./reconcile";

describe("normalizeCategoryName", () => {
  test("remove acentos, caixa e espaços extras", () => {
    expect(normalizeCategoryName("  Água ")).toBe("agua");
    expect(normalizeCategoryName("ALIMENTAÇÃO")).toBe("alimentacao");
    expect(normalizeCategoryName("Limpeza/Faxina")).toBe("limpeza/faxina");
  });

  test("colapsa espaços internos", () => {
    expect(normalizeCategoryName("Plano  de   Celular")).toBe(
      "plano de celular",
    );
  });
});

describe("resolveTransactionDate", () => {
  test("sem data usa o dia 1 do mês da aba", () => {
    expect(resolveTransactionDate(null, 1, 2026)).toEqual({
      date: "2026-01-01",
      originalDate: null,
    });
  });

  test("data dentro do mês da aba é mantida", () => {
    expect(resolveTransactionDate("2026-01-15", 1, 2026)).toEqual({
      date: "2026-01-15",
      originalDate: null,
    });
  });

  test("data de outro mês (parcela) vira dia 1 e preserva a original", () => {
    expect(resolveTransactionDate("2025-11-17", 1, 2026)).toEqual({
      date: "2026-01-01",
      originalDate: "2025-11-17",
    });
  });

  test("data inválida cai no dia 1 sem original", () => {
    expect(resolveTransactionDate("não é data", 2, 2026)).toEqual({
      date: "2026-02-01",
      originalDate: null,
    });
  });
});

describe("buildDescription", () => {
  test("usa a descrição da planilha quando existe", () => {
    expect(buildDescription("Agua", "ÁGUA", null)).toBe("ÁGUA");
  });

  test("cai no nome da categoria quando a descrição está vazia", () => {
    expect(buildDescription("Farmácia", null, null)).toBe("Farmácia");
  });

  test("anexa a data original quando a compra é de outro mês", () => {
    expect(buildDescription("Roupas Paula", "cinta 3 de 6", "2025-11-17")).toBe(
      "cinta 3 de 6 (compra em 2025-11-17)",
    );
  });
});

const desired = (overrides: Partial<DesiredTransaction>): DesiredTransaction => ({
  external_ref: "ref-1",
  description: "ÁGUA",
  amount: -320.76,
  date: "2026-01-01",
  category_id: "cat-1",
  payment_method: "Pix Rodrigo",
  ...overrides,
});

const existing = (
  overrides: Partial<ExistingTransaction>,
): ExistingTransaction => ({
  id: "tx-1",
  external_ref: "ref-1",
  description: "ÁGUA",
  amount: -320.76,
  date: "2026-01-01",
  category_id: "cat-1",
  payment_method: "Pix Rodrigo",
  ...overrides,
});

describe("diffTransactions", () => {
  test("ref novo vira insert", () => {
    const diff = diffTransactions([], [desired({})]);

    expect(diff.toInsert).toHaveLength(1);
    expect(diff.toUpdate).toHaveLength(0);
    expect(diff.toDeleteIds).toHaveLength(0);
  });

  test("linha idêntica é no-op (idempotência)", () => {
    const diff = diffTransactions([existing({})], [desired({})]);

    expect(diff.toInsert).toHaveLength(0);
    expect(diff.toUpdate).toHaveLength(0);
    expect(diff.toDeleteIds).toHaveLength(0);
  });

  test("valor editado na planilha vira update com o id existente", () => {
    const diff = diffTransactions(
      [existing({})],
      [desired({ amount: -400 })],
    );

    expect(diff.toUpdate).toEqual([
      expect.objectContaining({ id: "tx-1", amount: -400 }),
    ]);
    expect(diff.toInsert).toHaveLength(0);
  });

  test("ref ausente no snapshot vira delete (linha excluída)", () => {
    const diff = diffTransactions([existing({})], []);

    expect(diff.toDeleteIds).toEqual(["tx-1"]);
  });

  test("mistura: insere, atualiza, mantém e deleta na mesma chamada", () => {
    const diff = diffTransactions(
      [
        existing({}),
        existing({ id: "tx-2", external_ref: "ref-2", amount: -10 }),
        existing({ id: "tx-3", external_ref: "ref-3" }),
      ],
      [
        desired({}),
        desired({ external_ref: "ref-2", amount: -25 }),
        desired({ external_ref: "ref-4", description: "nova" }),
      ],
    );

    expect(diff.toInsert.map((t) => t.external_ref)).toEqual(["ref-4"]);
    expect(diff.toUpdate.map((t) => t.id)).toEqual(["tx-2"]);
    expect(diff.toDeleteIds).toEqual(["tx-3"]);
  });
});
