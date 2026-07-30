import { z } from "zod";

/**
 * Sugestões de tipo de conta (`bank_accounts.account_type`, PRD gap — mesma
 * decisão de `investment-schema.ts`/`ASSET_TYPE_SUGGESTIONS`): campo `TEXT`
 * livre no banco, sem enum rígido. A UI oferece estas sugestões num
 * `datalist`, mas aceita qualquer texto.
 */
export const ACCOUNT_TYPE_SUGGESTIONS = [
  "Corrente",
  "Poupança",
  "Investimento",
] as const;

export const bankAccountSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da conta."),
  bank_name: z.string().trim().min(1).nullable().optional(),
  account_type: z.string().trim().min(1).nullable().optional(),
  balance: z.coerce.number(),
});

export type BankAccountInput = z.infer<typeof bankAccountSchema>;
