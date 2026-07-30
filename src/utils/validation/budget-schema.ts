import { z } from "zod";

/**
 * Meta (`budgets`): valor planejado por categoria/mês/ano. `planned_amount`
 * aceita zero (meta "zerada" é válida — usuário quer só acompanhar o
 * realizado sem planejar gasto) mas não negativo.
 */
export const budgetSchema = z.object({
  category_id: z.string().trim().min(1, "Selecione uma categoria."),
  month: z.coerce
    .number()
    .int("Mês inválido.")
    .min(1, "Mês inválido.")
    .max(12, "Mês inválido."),
  year: z.coerce
    .number()
    .int("Ano inválido.")
    .min(2000, "Ano inválido.")
    .max(2100, "Ano inválido."),
  planned_amount: z.coerce
    .number()
    .nonnegative("O valor planejado não pode ser negativo."),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
