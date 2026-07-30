import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { LogList } from "@/components/n8n/log-list";

export const metadata: Metadata = {
  title: "Painel n8n",
};

/**
 * Server Component fino (mesmo padrão de `investimentos/page.tsx`): resolve
 * `profiles.id` e passa só essa string pro Client Component. Restrito a
 * `admin` (P08 em `nav-items.ts`) — checagem de defesa em profundidade
 * feita aqui de novo, já que a sidebar só *esconde* o link pra não-admins,
 * não bloqueia o acesso direto pela URL.
 */
export default async function N8nPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", data.claims.sub)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Painel n8n</h1>
      <p className="mt-1 text-sm text-muted">
        Eventos recebidos pelo webhook de integração (importação de extrato
        bancário e outras automações). Sincronização bancária real depende de
        você configurar um workflow n8n apontando para{" "}
        <code className="rounded bg-background px-1 py-0.5 text-xs">
          /api/webhooks/n8n
        </code>
        .
      </p>

      <div className="mt-6">
        <LogList profileId={profile.id} />
      </div>
    </div>
  );
}
