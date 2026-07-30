import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { InvestmentsView } from "@/components/investments/investments-view";

export const metadata: Metadata = {
  title: "Investimentos",
};

/**
 * Server Component fino (mesmo padrão de `categorias/page.tsx`): resolve
 * `profiles.id` e passa só essa string pro Client Component de
 * investimentos.
 */
export default async function InvestimentosPage() {
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
      <h1 className="text-2xl font-bold tracking-tight">Investimentos</h1>
      <p className="mt-1 text-sm text-muted">
        Acompanhe sua carteira consolidada e a rentabilidade por ativo.
      </p>

      <div className="mt-6">
        <InvestmentsView profileId={profile.id} />
      </div>
    </div>
  );
}
