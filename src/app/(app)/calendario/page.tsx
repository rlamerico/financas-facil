import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { CalendarView } from "@/components/calendar/calendar-view";

export const metadata: Metadata = {
  title: "Calendário de Contas",
};

/**
 * Server Component fino (mesmo padrão de `contas/page.tsx` e
 * `investimentos/page.tsx`): resolve `profiles.id` e passa só essa string
 * pro Client Component do calendário.
 */
export default async function CalendarioPage() {
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
      <h1 className="text-2xl font-bold tracking-tight">
        Calendário de Contas
      </h1>
      <p className="mt-1 text-sm text-muted">
        Visualize suas contas pendentes organizadas por dia do mês.
      </p>

      <div className="mt-6">
        <CalendarView profileId={profile.id} />
      </div>
    </div>
  );
}
