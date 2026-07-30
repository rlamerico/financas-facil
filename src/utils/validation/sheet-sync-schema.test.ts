import { describe, expect, test } from "vitest";
import { sheetSyncPayloadSchema } from "./sheet-sync-schema";

const validPayload = {
  profile_id: "3f8a2b1c-4d5e-6f70-8192-a3b4c5d6e7f8",
  months: [
    {
      month: 1,
      year: 2026,
      transactions: [
        {
          ref: "row-uuid-1",
          date: "2026-01-15",
          category: "Agua",
          description: "ÁGUA",
          amount: 320.76,
          payment_method: "Pix Rodrigo",
        },
      ],
      incomes: [{ ref: "row-uuid-2", description: "Pró-labore", amount: 2211.71 }],
      budgets: [{ category: "Agua", planned: 350 }],
    },
  ],
};

describe("sheetSyncPayloadSchema", () => {
  test("aceita snapshot completo válido", () => {
    const result = sheetSyncPayloadSchema.safeParse(validPayload);

    expect(result.success).toBe(true);
  });

  test("date, description e payment_method são opcionais no lançamento", () => {
    const result = sheetSyncPayloadSchema.safeParse({
      ...validPayload,
      months: [
        {
          month: 2,
          year: 2026,
          transactions: [{ ref: "r1", category: "Farmácia", amount: 52.05 }],
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  test("rejeita profile_id que não é UUID", () => {
    const result = sheetSyncPayloadSchema.safeParse({
      ...validPayload,
      profile_id: "não-uuid",
    });

    expect(result.success).toBe(false);
  });

  test("rejeita lançamento sem ref ou com valor zero", () => {
    const withoutRef = sheetSyncPayloadSchema.safeParse({
      ...validPayload,
      months: [
        {
          month: 1,
          year: 2026,
          transactions: [{ ref: "", category: "Agua", amount: 10 }],
        },
      ],
    });
    const zeroAmount = sheetSyncPayloadSchema.safeParse({
      ...validPayload,
      months: [
        {
          month: 1,
          year: 2026,
          transactions: [{ ref: "r1", category: "Agua", amount: 0 }],
        },
      ],
    });

    expect(withoutRef.success).toBe(false);
    expect(zeroAmount.success).toBe(false);
  });

  test("rejeita mês fora de 1-12 e lista de meses vazia", () => {
    const badMonth = sheetSyncPayloadSchema.safeParse({
      ...validPayload,
      months: [{ month: 13, year: 2026, transactions: [] }],
    });
    const emptyMonths = sheetSyncPayloadSchema.safeParse({
      ...validPayload,
      months: [],
    });

    expect(badMonth.success).toBe(false);
    expect(emptyMonths.success).toBe(false);
  });
});
