import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/services/supabase/service-role";
import { isWebhookSecretValid } from "@/utils/webhook-auth";
import { webhookPayloadSchema } from "@/utils/validation/webhook-payload-schema";
import type { Json } from "@/types/database";

const WEBHOOK_SOURCE = "n8n";

type ServiceRoleClient = ReturnType<typeof createServiceRoleClient>;

async function logIntegrationEvent(
  supabase: ServiceRoleClient,
  params: { profileId: string | null; status: string; payload: Json | null },
) {
  await supabase.from("integrations_log").insert({
    source: WEBHOOK_SOURCE,
    status: params.status,
    payload: params.payload,
    profile_id: params.profileId,
  });
}

/**
 * Webhook receptor de eventos do n8n (ex.: importação de extrato bancário).
 * Roda exclusivamente no servidor com a `service_role` key — não há sessão
 * de usuário aqui, então `profile_id` precisa vir explícito no payload e é
 * validado contra a tabela `profiles` antes de qualquer INSERT.
 *
 * Sincronização bancária real (n8n/Open Finance) está fora do MVP — este é
 * só o lado receptor; o workflow n8n que chama este endpoint é um follow-up
 * de configuração do usuário, não implementado aqui.
 */
export async function POST(request: Request) {
  const supabase = createServiceRoleClient();
  const receivedSecret = request.headers.get("x-webhook-secret");

  if (!isWebhookSecretValid(receivedSecret, process.env.N8N_WEBHOOK_SECRET)) {
    await logIntegrationEvent(supabase, {
      profileId: null,
      status: "unauthorized",
      payload: null,
    });
    return NextResponse.json({ error: "Secret inválido." }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    await logIntegrationEvent(supabase, {
      profileId: null,
      status: "error",
      payload: null,
    });
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = webhookPayloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    await logIntegrationEvent(supabase, {
      profileId: null,
      status: "error",
      payload: rawBody as Json,
    });
    return NextResponse.json(
      {
        error: "Payload inválido.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const { profile_id, description, amount, date, category_id, status } =
    parsed.data;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profile_id)
    .maybeSingle();

  if (!profile) {
    await logIntegrationEvent(supabase, {
      profileId: null,
      status: "error",
      payload: parsed.data as unknown as Json,
    });
    return NextResponse.json(
      { error: "profile_id não encontrado." },
      { status: 404 },
    );
  }

  const { data: transaction, error: insertError } = await supabase
    .from("transactions")
    .insert({
      profile_id,
      description,
      amount,
      date,
      category_id: category_id ?? null,
      status: status ?? "completed",
      source: WEBHOOK_SOURCE,
    })
    .select("id")
    .single();

  if (insertError || !transaction) {
    await logIntegrationEvent(supabase, {
      profileId: profile_id,
      status: "error",
      payload: parsed.data as unknown as Json,
    });
    return NextResponse.json(
      { error: "Não foi possível inserir a transação." },
      { status: 500 },
    );
  }

  await logIntegrationEvent(supabase, {
    profileId: profile_id,
    status: "success",
    payload: parsed.data as unknown as Json,
  });

  return NextResponse.json({ id: transaction.id }, { status: 201 });
}
