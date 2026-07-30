import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { ReportsView } from "@/components/reports/reports-view";

export const metadata: Metadata = {
  title: "Relatórios",
};

/**
 * Server Component fino (mesmo padrão de `investimentos/page.tsx`): resolve
 * `profiles.id` e passa só essa string pro Client Component de relatórios.
 */
export default async function RelatoriosPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", data.claims.sub)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
      <p className="mt-1 text-sm text-muted">
        Despesas por categoria, Planejado × Realizado e evolução do saldo.
      </p>

      <div className="mt-6">
        <ReportsView profileId={profile.id} />
      </div>
    </div>
  );
}
