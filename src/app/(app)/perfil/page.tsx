import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { PerfilView } from "@/components/perfil/perfil-view";

export const metadata: Metadata = {
  title: "Perfil",
};

/**
 * Server Component fino (mesmo padrão de `contas/page.tsx`): resolve
 * `profiles.id` e o `user_id` (auth) e passa só essas duas strings pro
 * Client Component — o `user_id` é necessário pro path de upload do avatar
 * (`{user_id}/avatar.*`, checado pela policy de storage da migration 007).
 */
export default async function PerfilPage() {
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
      <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
      <p className="mt-1 text-sm text-muted">
        Atualize seu nome e foto de perfil.
      </p>

      <div className="mt-6">
        <PerfilView profileId={profile.id} userId={data.claims.sub} />
      </div>
    </div>
  );
}
