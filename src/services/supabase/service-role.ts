import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Supabase client com a `service_role` key — bypassa RLS.
 *
 * USO EXCLUSIVO em Route Handlers que não têm sessão de usuário (ex.: o
 * webhook do n8n, `src/app/api/webhooks/n8n/route.ts`), que roda somente no
 * servidor. NUNCA importar isto num Client Component nem em qualquer código
 * que possa rodar no browser — a `service_role` key tem acesso total ao
 * banco, sem passar pelas policies de RLS.
 *
 * Diferente de `services/supabase/{client,server}.ts` (que usam
 * `@supabase/ssr` e dependem de cookies de sessão), este client usa
 * `@supabase/supabase-js` puro, sem gerenciamento de sessão — não faz
 * sentido para um contexto sem usuário logado.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
