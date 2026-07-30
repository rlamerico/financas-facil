import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { CategoriesView } from "@/components/categories/categories-view";
import { BudgetsSection } from "@/components/budgets/budgets-section";

export const metadata: Metadata = {
  title: "Categorias e Metas",
};

/**
 * Server Component fino (mesmo padrão de `transacoes/page.tsx`): resolve
 * `profiles.id` e passa só essa string pros Client Components de
 * categorias e metas.
 */
export default async function CategoriasPage() {
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
      <h1 className="text-2xl font-bold tracking-tight">Categorias e Metas</h1>
      <p className="mt-1 text-sm text-muted">
        Organize suas categorias e defina quanto planeja gastar em cada uma por mês.
      </p>

      <div className="mt-6">
        <CategoriesView profileId={profile.id} />
        <BudgetsSection profileId={profile.id} />
      </div>
    </div>
  );
}
