import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { BankAccountsView } from "@/components/bank-accounts/bank-accounts-view";

export const metadata: Metadata = {
  title: "Contas Bancárias",
};

/**
 * Server Component fino (mesmo padrão de `investimentos/page.tsx`): resolve
 * `profiles.id` e passa só essa string pro Client Component de contas.
 */
export default async function ContasPage() {
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
      <h1 className="text-2xl font-bold tracking-tight">Contas Bancárias</h1>
      <p className="mt-1 text-sm text-muted">
        Cadastre suas contas e mantenha os saldos atualizados manualmente.
      </p>

      <div className="mt-6">
        <BankAccountsView profileId={profile.id} />
      </div>
    </div>
  );
}
