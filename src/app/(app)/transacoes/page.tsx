import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { TransactionsView } from "@/components/transactions/transactions-view";

export const metadata: Metadata = {
  title: "Transações",
};

/**
 * Server Component fino (mesmo padrão de `(app)/layout.tsx`): resolve
 * `profiles.id` e passa só essa string (segura de atravessar a fronteira
 * RSC -> Client) pro `TransactionsView`, que é quem busca/edita dados.
 */
export default async function TransacoesPage() {
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
      <h1 className="text-2xl font-bold tracking-tight">Transações</h1>
      <p className="mt-1 text-sm text-muted">
        Lance receitas e despesas e acompanhe o histórico completo.
      </p>

      <div className="mt-6">
        <TransactionsView profileId={profile.id} />
      </div>
    </div>
  );
}
