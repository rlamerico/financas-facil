"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/services/supabase/client";
import type { Tables, TablesUpdate } from "@/types/database";
import type { Role } from "@/components/layout/nav-items";

export type AdminProfile = Tables<"profiles">;

const ADMIN_PROFILES_QUERY_KEY = ["profiles", "admin-list"] as const;

async function fetchAllProfiles(): Promise<AdminProfile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Lista todos os perfis do sistema (P12, admin-only) — depende da policy
 * "Admins can view all profiles" (migration 007). Para um não-admin (se essa
 * tela fosse alcançada, o que a checagem de role em `configuracoes/page.tsx`
 * já impede), a RLS simplesmente devolveria só a própria linha, sem erro —
 * por isso a checagem de defesa em profundidade fica no Server Component da
 * página, não aqui.
 */
export function useAdminProfiles() {
  return useQuery({
    queryKey: ADMIN_PROFILES_QUERY_KEY,
    queryFn: fetchAllProfiles,
  });
}

export interface UpdateProfileRoleInput {
  id: string;
  role: Role;
}

/**
 * Muda o `role` de outro usuário — depende da policy "Admins can update any
 * profile" (migration 007). O trigger `enforce_role_change_admin_only` (mesma
 * migration) garante no banco que só quem já é admin consegue de fato alterar
 * essa coluna, mesmo que a policy de dono também desse `UPDATE` na linha.
 */
export function useUpdateProfileRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, role }: UpdateProfileRoleInput) => {
      const supabase = createClient();
      const payload: TablesUpdate<"profiles"> = { role };
      const { data, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PROFILES_QUERY_KEY });
    },
  });
}
