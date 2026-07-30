"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/services/supabase/client";
import type { Tables, TablesUpdate } from "@/types/database";

export type Profile = Tables<"profiles">;

function profileQueryKey(profileId: string) {
  return ["profile", profileId] as const;
}

async function fetchProfile(profileId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Perfil do usuário logado (P11). Sem Realtime — a linha só muda por ação
 * direta do próprio usuário nesta tela, mesmo padrão de `useBankAccounts`.
 */
export function useProfile(profileId: string) {
  return useQuery({
    queryKey: profileQueryKey(profileId),
    queryFn: () => fetchProfile(profileId),
    enabled: Boolean(profileId),
  });
}

export interface UpdateProfileInput {
  full_name: string;
}

export function useUpdateProfile(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const supabase = createClient();
      const payload: TablesUpdate<"profiles"> = { ...input };
      const { data, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", profileId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey(profileId) });
    },
  });
}

export interface UploadAvatarInput {
  userId: string;
  file: File;
}

/**
 * Upload de avatar: `upsert: true` no path `{user_id}/avatar.{ext}` (permite
 * trocar a foto sem acumular arquivos órfãos no bucket `avatars`, migration
 * 007 — cada usuário só escreve no próprio path). Depois grava a URL pública
 * (bucket público, sem precisar assinar) em `profiles.avatar_url`, com um
 * parâmetro de cache-busting pra evitar que o browser continue mostrando a
 * foto antiga (o path não muda entre uploads por causa do `upsert`).
 */
export function useUploadAvatar(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, file }: UploadAvatarInput) => {
      const supabase = createClient();
      const extension = file.name.split(".").pop() ?? "png";
      const path = `${userId}/avatar.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${publicUrlData.publicUrl}?updated=${Date.now()}`;

      const { data, error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", profileId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey(profileId) });
    },
  });
}
