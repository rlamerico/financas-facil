import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { PlanningView } from "@/components/budgets/planning-view";

export const metadata: Metadata = {
  title: "Planejamento Mensal",
};

/**
 * Server Component fino (mesmo padrão de `transacoes/page.tsx`): resolve
 * `profiles.id` e passa só essa string pro `PlanningView`.
 */
export default async function PlanejamentoPage() {
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
      <h1 className="text-2xl font-bold tracking-tight">Planejamento Mensal</h1>
      <p className="mt-1 text-sm text-muted">
        Compare o planejado com o realizado por categoria em cada mês.
      </p>

      <div className="mt-6">
        <PlanningView profileId={profile.id} />
      </div>
    </div>
  );
}
