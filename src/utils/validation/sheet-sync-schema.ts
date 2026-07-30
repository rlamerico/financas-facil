import { z } from "zod";

/**
 * Snapshot enviado pelo Apps Script da planilha "Finanças Familiares 2026"
 * (`scripts/apps-script/sheet-sync.gs`) para o endpoint
 * `src/app/api/webhooks/sheet-sync/route.ts`.
 *
 * Valores vêm SEM sinal (a planilha registra despesas como números
 * positivos) — o handler aplica o sinal: despesas ficam negativas,
 * entradas positivas (convenção de `transaction-schema.ts`).
 *
 * `ref` é o UUID estável que o script grava numa coluna auxiliar da
 * planilha — é a chave do espelho (upsert/delete por `external_ref`).
 */
const expenseRowSchema = z.object({
  ref: z.string().trim().min(1, "Linha sem ref estável."),
  date: z.string().trim().nullable().optional(),
  category: z.string().trim().min(1, "Linha sem categoria."),
  description: z.string().trim().nullable().optional(),
  amount: z.coerce.number().positive("O valor deve ser maior que zero."),
  payment_method: z.string().trim().nullable().optional(),
});

const incomeRowSchema = z.object({
  ref: z.string().trim().min(1, "Entrada sem ref estável."),
  description: z.string().trim().min(1, "Entrada sem descrição."),
  amount: z.coerce.number().positive("O valor deve ser maior que zero."),
});

const budgetRowSchema = z.object({
  category: z.string().trim().min(1, "Orçamento sem categoria."),
  planned: z.coerce.number().min(0, "Planejado não pode ser negativo."),
});

const monthSnapshotSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  transactions: z.array(expenseRowSchema),
  incomes: z.array(incomeRowSchema).default([]),
  budgets: z.array(budgetRowSchema).default([]),
});

export const sheetSyncPayloadSchema = z.object({
  profile_id: z.string().trim().uuid("profile_id deve ser um UUID válido."),
  months: z.array(monthSnapshotSchema).min(1, "Envie ao menos um mês."),
});

export type SheetSyncPayload = z.infer<typeof sheetSyncPayloadSchema>;
export type MonthSnapshot = z.infer<typeof monthSnapshotSchema>;
