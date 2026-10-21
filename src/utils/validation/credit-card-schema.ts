import { z } from "zod";

/**
 * O usuário fecha as contas em dois grupos ("Compras Pessoais" × "RPA" na
 * planilha), e é exatamente esse o CHECK de `credit_cards.card_group`. Um
 * terceiro grupo exige migration nova, não uma opção a mais aqui.
 */
export const CARD_GROUPS = [
  { value: "pessoal", label: "Pessoal" },
  { value: "empresa", label: "Empresa" },
] as const;

export type CardGroup = (typeof CARD_GROUPS)[number]["value"];

export const creditCardSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do cartão."),
  last_four: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Informe os 4 últimos dígitos."),
  issuer: z.string().trim().min(1).nullable().optional(),
  holder_label: z.string().trim().min(1).nullable().optional(),
  card_group: z.enum(["pessoal", "empresa"]),
  color: z.string().trim().nullable().optional(),
});

export type CreditCardInput = z.infer<typeof creditCardSchema>;

export const cardAliasSchema = z.object({
  alias: z.string().trim().min(1, "Informe o apelido."),
});

export type CardAliasInput = z.infer<typeof cardAliasSchema>;
