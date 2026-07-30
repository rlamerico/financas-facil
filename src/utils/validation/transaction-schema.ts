import { z } from "zod";

export const TRANSACTION_TYPES = ["income", "expense"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const transactionSchema = z.object({
  description: z.string().trim().min(1, "Informe uma descrição."),
  amount: z.coerce.number().positive("O valor deve ser maior que zero."),
  date: z.string().trim().min(1, "Informe a data."),
  category_id: z.string().trim().min(1).nullable().optional(),
  type: z.enum(TRANSACTION_TYPES),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

/**
 * Deriva o valor com sinal a partir do tipo escolhido no formulário:
 * receitas ficam positivas, despesas negativas. É esse valor com sinal
 * que é persistido em `transactions.amount`, o que deixa `summarizeTransactions`
 * trivial (soma direta pra achar o saldo).
 */
export function toSignedAmount(
  input: Pick<TransactionInput, "amount" | "type">,
): number {
  return input.type === "expense"
    ? -Math.abs(input.amount)
    : Math.abs(input.amount);
}
