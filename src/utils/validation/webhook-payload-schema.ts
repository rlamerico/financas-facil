import { z } from "zod";

/**
 * Payload esperado no webhook receptor do n8n
 * (`src/app/api/webhooks/n8n/route.ts`). Representa uma transação importada
 * de um extrato bancário (ou outra automação externa) — diferente do
 * formulário manual (`transaction-schema.ts`), aqui `amount` já vem **com
 * sinal** (positivo = crédito/receita, negativo = débito/despesa), porque
 * quem envia é um sistema externo que já sabe o sinal, não um usuário
 * escolhendo "receita"/"despesa" numa UI.
 *
 * `profile_id` precisa ser explícito no payload — o Route Handler roda com
 * a `service_role` key (sem sessão de usuário via `auth.uid()`), então não
 * há como inferir o dono da transação a partir de uma sessão. O handler
 * ainda valida esse `profile_id` contra a tabela `profiles` antes de
 * inserir (não confia cegamente no valor recebido).
 */
export const TRANSACTION_STATUSES = ["pending", "completed"] as const;

export const webhookPayloadSchema = z.object({
  profile_id: z.string().trim().uuid("profile_id deve ser um UUID válido."),
  description: z.string().trim().min(1, "Informe uma descrição."),
  amount: z.coerce
    .number()
    .refine((value) => value !== 0, "O valor não pode ser zero."),
  date: z.string().trim().min(1, "Informe a data."),
  category_id: z.string().trim().uuid().nullable().optional(),
  status: z.enum(TRANSACTION_STATUSES).optional(),
});

export type WebhookPayloadInput = z.infer<typeof webhookPayloadSchema>;
