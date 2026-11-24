import { z } from "zod";

export const EXCLUSION_MATCH_TYPES = [
  "description_contains",
  "category_equals",
  "negative_amount",
] as const;

/** Rótulos em português para a UI — o valor gravado segue em inglês. */
export const EXCLUSION_MATCH_TYPE_LABELS: Record<
  (typeof EXCLUSION_MATCH_TYPES)[number],
  string
> = {
  description_contains: "Descrição contém",
  category_equals: "Categoria é igual a",
  negative_amount: "Valor negativo",
};

export const exclusionRuleSchema = z
  .object({
    name: z.string().trim().min(1, "Dê um nome à regra."),
    match_type: z.enum(EXCLUSION_MATCH_TYPES),
    match_value: z.string().trim().nullable().optional(),
    card_id: z.uuid().nullable().optional(),
    is_active: z.boolean().default(true),
  })
  .refine((rule) => rule.match_type === "negative_amount" || Boolean(rule.match_value), {
    path: ["match_value"],
    message: "Informe o texto a procurar.",
  });

export type ExclusionRuleInput = z.infer<typeof exclusionRuleSchema>;
