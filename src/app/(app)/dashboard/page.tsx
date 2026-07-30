import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Server Component fino: resolve `profiles.id` (mesmo padrão do layout do
 * shell) e passa só essa string pro `DashboardContent`, que busca os dados
 * reais via `useTransactions`/React Query.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("user_id", data.claims.sub)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const name = profile.full_name?.trim() || "por aqui";

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Bem-vindo, {name}</h1>
      <p className="mt-1 text-sm text-muted">
        Visão consolidada do seu saldo e das transações recentes.
      </p>

      <div className="mt-6">
        <DashboardContent profileId={profile.id} />
      </div>
    </div>
  );
}
