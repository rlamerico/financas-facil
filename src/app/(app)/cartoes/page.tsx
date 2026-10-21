import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { CardsView } from "@/components/cards/cards-view";

export const metadata: Metadata = {
  title: "Faturas de Cartão",
};

/**
 * Server Component fino (mesmo padrão de `contas/page.tsx`): resolve
 * `profiles.id` e passa só essa string pro Client Component de cartões.
 */
export default async function CartoesPage() {
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
      <h1 className="text-2xl font-bold tracking-tight">Faturas de Cartão</h1>
      <p className="mt-1 text-sm text-muted">
        Acompanhe o gasto dos seus cartões de crédito mês a mês.
      </p>

      <div className="mt-6">
        <CardsView profileId={profile.id} />
      </div>
    </div>
  );
}
