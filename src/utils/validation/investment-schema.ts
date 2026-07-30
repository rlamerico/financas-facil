import { z } from "zod";

/**
 * Sugestões de tipo de ativo (PRD §2.2, módulo Investimentos). O campo
 * `asset_type` no banco é `TEXT` livre (não um enum de verdade) — a UI
 * oferece estas sugestões num `datalist`, mas aceita qualquer texto não
 * vazio, então usuários não ficam travados numa lista fechada.
 */
export const ASSET_TYPE_SUGGESTIONS = [
  "Renda Fixa",
  "Renda Variável",
  "Cripto",
] as const;

/**
 * Investimento (`investments`). `current_price` é opcional/nullable e
 * **editável manualmente** — não há integração automática de cotação nesta
 * fase (decisão pendente do usuário sobre qual API de mercado usar, ex.:
 * Brapi, CoinGecko). Um `current_price` ausente significa "sem cotação
 * ainda", tratado como tal (não como zero) por `calculatePortfolioReturn`.
 */
export const investmentSchema = z.object({
  asset_name: z.string().trim().min(1, "Informe o nome do ativo."),
  asset_type: z.string().trim().min(1, "Informe o tipo do ativo."),
  quantity: z.coerce.number().positive("A quantidade deve ser maior que zero."),
  average_price: z.coerce
    .number()
    .positive("O preço médio deve ser maior que zero."),
  current_price: z.coerce
    .number()
    .positive("O preço atual deve ser maior que zero.")
    .nullable()
    .optional(),
});

export type InvestmentInput = z.infer<typeof investmentSchema>;
