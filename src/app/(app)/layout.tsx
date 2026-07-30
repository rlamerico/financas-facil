import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import type { Role } from "@/components/layout/nav-items";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileBottomBar } from "@/components/layout/mobile-bottom-bar";

const DEFAULT_ROLE: Role = "user";

/**
 * Shell protegido (sidebar/topbar/bottom bar) — PRD §4.4.
 *
 * Defesa em profundidade: o middleware já renova/checa a sessão, mas a
 * autorização de fato é checada de novo aqui via getClaims(), que valida o
 * JWT localmente sem round-trip ao Auth server.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("user_id", data.claims.sub)
    .single();

  const role = (profile?.role as Role | undefined) ?? DEFAULT_ROLE;

  return (
    <div className="flex min-h-full flex-1">
      <Sidebar role={role} />

      <div className="flex flex-1 flex-col">
        <Topbar fullName={profile?.full_name ?? null} role={role} />

        <main className="flex-1 bg-background p-4 pb-20 lg:p-8 lg:pb-8 print:bg-white print:p-0">
          {children}
        </main>
      </div>

      <MobileBottomBar role={role} />
    </div>
  );
}
