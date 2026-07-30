"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/services/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Investment = Tables<"investments">;

function investmentsQueryKey(profileId: string) {
  return ["investments", profileId] as const;
}

async function fetchInvestments(profileId: string): Promise<Investment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("investments")
    .select("*")
    .eq("profile_id", profileId)
    .order("asset_name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Lista os investimentos do perfil. Sem Realtime (mesmo padrão de
 * `useBudgets`): investimentos mudam por ação direta do usuário, não por
 * integração externa — invalidação via mutation já é suficiente.
 */
export function useInvestments(profileId: string) {
  return useQuery({
    queryKey: investmentsQueryKey(profileId),
    queryFn: () => fetchInvestments(profileId),
    enabled: Boolean(profileId),
  });
}

export interface CreateInvestmentInput {
  asset_name: string;
  asset_type: string;
  quantity: number;
  average_price: number;
  current_price?: number | null;
}

export function useCreateInvestment(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInvestmentInput) => {
      const supabase = createClient();
      const payload: TablesInsert<"investments"> = {
        ...input,
        profile_id: profileId,
      };
      const { data, error } = await supabase
        .from("investments")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentsQueryKey(profileId) });
    },
  });
}

export interface UpdateInvestmentInput {
  id: string;
  asset_name: string;
  asset_type: string;
  quantity: number;
  average_price: number;
  current_price?: number | null;
}

export function useUpdateInvestment(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateInvestmentInput) => {
      const supabase = createClient();
      const payload: TablesUpdate<"investments"> = {
        ...input,
        last_updated: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("investments")
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
      queryClient.invalidateQueries({ queryKey: investmentsQueryKey(profileId) });
    },
  });
}

export function useDeleteInvestment(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("investments").delete().eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentsQueryKey(profileId) });
    },
  });
}
