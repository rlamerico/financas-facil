import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { cn } from "@/utils/cn";
import { ConfiguracoesView } from "@/components/configuracoes/configuracoes-view";
import { ExportSection } from "@/components/configuracoes/export-section";

export const metadata: Metadata = {
  title: "Configurações de Sistema",
};

/**
 * P12, admin-only (mesmo padrão de `n8n/page.tsx`). Defesa em profundidade:
 * a sidebar já esconde o link pra não-admins, mas a página checa `role` de
 * novo — acesso direto pela URL não deve renderizar nada sensível (gestão de
 * usuários, status de segredo de servidor).
 *
 * O status do n8n é checado aqui, no servidor, só como booleano — o valor de
 * `N8N_WEBHOOK_SECRET` nunca é lido pelo client nem serializado.
 */
export default async function ConfiguracoesPage() {
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
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações de Sistema</h1>
        <p className="mt-4 text-sm text-error">
          Acesso restrito a administradores.
        </p>
      </div>
    );
  }

  const isN8nConfigured = Boolean(process.env.N8N_WEBHOOK_SECRET);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Configurações de Sistema</h1>
      <p className="mt-1 text-sm text-muted">
        Gestão de usuários e status das integrações.
      </p>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-foreground">Integração n8n</h2>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              isN8nConfigured ? "bg-success/10 text-success" : "bg-muted/10 text-muted",
            )}
          >
            {isN8nConfigured ? "Configurado" : "Não configurado"}
          </span>
          <p className="text-xs text-muted">
            Baseado na presença de{" "}
            <code className="rounded bg-background px-1 py-0.5">N8N_WEBHOOK_SECRET</code>{" "}
            no servidor.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Usuários</h2>
        <div className="mt-2">
          <ConfiguracoesView currentProfileId={profile.id} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Exportar meus dados</h2>
        <div className="mt-2">
          <ExportSection profileId={profile.id} />
        </div>
      </section>
    </div>
  );
}
