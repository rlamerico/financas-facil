"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { profileSchema, avatarFileSchema } from "@/utils/validation/profile-schema";
import { useProfile, useUpdateProfile, useUploadAvatar, type Profile } from "@/hooks/use-profile";

interface PerfilViewProps {
  profileId: string;
  userId: string;
}

const GENERIC_SAVE_ERROR = "Não foi possível salvar o perfil. Tente novamente.";
const GENERIC_AVATAR_ERROR = "Não foi possível enviar a foto. Tente novamente.";

/**
 * Client Component do Perfil (P11): editar `full_name` + upload de avatar.
 * Regra de ouro: só `profileId`/`userId` (strings) atravessam a fronteira
 * Server → Client, mesmo padrão de `BankAccountsView`.
 *
 * Componente fino que só resolve o carregamento — o formulário em si
 * (`PerfilForm`) só é montado depois que `profile` chega, `key`ado por
 * `profile.id`, pra inicializar o estado local do input a partir do dado já
 * carregado em vez de sincronizar via `useEffect` (evita a re-render extra
 * do padrão "state derivado de prop via effect").
 */
export function PerfilView({ profileId, userId }: PerfilViewProps) {
  const { data: profile, isLoading, isError } = useProfile(profileId);

  if (isLoading) {
    return <p className="text-sm text-muted">Carregando perfil...</p>;
  }

  if (isError || !profile) {
    return <p className="text-sm text-error">Não foi possível carregar o perfil.</p>;
  }

  return <PerfilForm key={profile.id} profileId={profileId} userId={userId} profile={profile} />;
}

interface PerfilFormProps {
  profileId: string;
  userId: string;
  profile: Profile;
}

function PerfilForm({ profileId, userId, profile }: PerfilFormProps) {
  const updateProfile = useUpdateProfile(profileId);
  const uploadAvatar = useUploadAvatar(profileId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(false);

    const result = profileSchema.safeParse({ full_name: fullName });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    try {
      await updateProfile.mutateAsync(result.data);
      setSaved(true);
    } catch {
      setErrors({ form: GENERIC_SAVE_ERROR });
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    const result = avatarFileSchema.safeParse(file);
    if (!result.success) {
      setAvatarError(result.error.issues[0]?.message ?? GENERIC_AVATAR_ERROR);
      return;
    }

    setAvatarError(null);
    try {
      const updated = await uploadAvatar.mutateAsync({ userId, file: result.data });
      setAvatarUrl(updated.avatar_url);
    } catch {
      setAvatarError(GENERIC_AVATAR_ERROR);
    }
  };

  return (
    <div className="max-w-lg space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-surface">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL pública dinâmica do Storage, sem domínio fixo pro next/image.
            <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
          ) : (
            <UserCircle className="h-12 w-12 text-muted" aria-hidden />
          )}
        </div>

        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAvatar.isPending}
          >
            {uploadAvatar.isPending ? "Enviando..." : "Trocar foto"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          {avatarError && <p className="mt-1 text-xs text-error">{avatarError}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="profile-full-name" className="text-sm font-medium">
            Nome completo
          </label>
          <input
            id="profile-full-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          {errors.full_name && <p className="mt-1 text-xs text-error">{errors.full_name}</p>}
        </div>

        {errors.form && <p className="text-sm text-error">{errors.form}</p>}
        {saved && !errors.form && <p className="text-sm text-success">Perfil atualizado.</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
