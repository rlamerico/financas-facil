"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import {
  useAdminProfiles,
  useUpdateProfileRole,
  type AdminProfile,
} from "@/hooks/use-admin-profiles";
import { ROLE_OPTIONS } from "@/utils/validation/profile-schema";
import type { Role } from "@/components/layout/nav-items";

interface ConfiguracoesViewProps {
  currentProfileId: string;
}

const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  user: "Usuário",
  viewer: "Visualizador",
};

/**
 * Gestão de usuários (P12, admin-only): lista todos os `profiles`
 * (policy "Admins can view all profiles") e permite trocar o `role` de
 * qualquer usuário (policy "Admins can update any profile" + trigger
 * `enforce_role_change_admin_only`, migration 007).
 *
 * O próprio admin logado não pode alterar o próprio papel por aqui (select
 * desabilitado) — o banco já bloquearia via trigger (só admin pode mudar
 * role, e um admin mudando o PRÓPRIO role continuaria passando no trigger),
 * mas isso evita o admin se auto-rebaixar por engano e ficar trancado fora
 * de Configurações sem outro admin pra reverter.
 */
export function ConfiguracoesView({ currentProfileId }: ConfiguracoesViewProps) {
  const { data: profiles, isLoading, isError } = useAdminProfiles();
  const updateRole = useUpdateProfileRole();
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const handleRoleChange = async (profile: AdminProfile, role: Role) => {
    setRowError((prev) => ({ ...prev, [profile.id]: "" }));
    try {
      await updateRole.mutateAsync({ id: profile.id, role });
    } catch {
      setRowError((prev) => ({
        ...prev,
        [profile.id]: "Não foi possível atualizar o papel deste usuário.",
      }));
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted">Carregando usuários...</p>;
  }

  if (isError) {
    return <p className="text-sm text-error">Não foi possível carregar os usuários.</p>;
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-surface shadow-card">
      {(profiles ?? []).map((profile) => {
        const isSelf = profile.id === currentProfileId;
        return (
          <div
            key={profile.id}
            className="flex flex-wrap items-center justify-between gap-2 p-4"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {profile.full_name || "Sem nome cadastrado"}
              </p>
              {isSelf && <p className="text-xs text-muted">Você</p>}
              {rowError[profile.id] && (
                <p className="mt-1 text-xs text-error">{rowError[profile.id]}</p>
              )}
            </div>

            <select
              aria-label={`Papel de ${profile.full_name || "usuário"}`}
              value={profile.role ?? "user"}
              disabled={isSelf || updateRole.isPending}
              onChange={(event) => handleRoleChange(profile, event.target.value as Role)}
              className={cn(
                "rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                (isSelf || updateRole.isPending) && "opacity-50",
              )}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
          </div>
        );
      })}
      {(profiles ?? []).length === 0 && (
        <p className="p-4 text-sm text-muted">Nenhum usuário encontrado.</p>
      )}
    </div>
  );
}
