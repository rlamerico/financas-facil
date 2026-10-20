import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BusinessShell } from "@/components/business/business-shell";
import { createClient } from "@/services/supabase/server";

/** Server Component: resolve o `profiles.id` e entrega só a string ao shell do módulo. */
export default async function EmpresaLayout({ children }: { children: ReactNode }) {
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

  return <BusinessShell profileId={profile.id}>{children}</BusinessShell>;
}
