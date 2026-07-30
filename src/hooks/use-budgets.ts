"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/services/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Budget = Tables<"budgets">;

function budgetsQueryKey(profileId: string, month: number, year: number) {
  return ["budgets", profileId, month, year] as const;
}

async function fetchBudgets(
  profileId: string,
  month: number,
  year: number,
): Promise<Budget[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("profile_id", profileId)
    .eq("month", month)
    .eq("year", year);

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Lista as metas (`budgets`) do perfil pra um mês/ano específico. Sem
 * Realtime (diferente de `useTransactions`): metas mudam com pouca
 * frequência (o usuário edita, não um sistema externo), invalidação via
 * mutation já é suficiente.
 */
export function useBudgets(profileId: string, month: number, year: number) {
  return useQuery({
    queryKey: budgetsQueryKey(profileId, month, year),
    queryFn: () => fetchBudgets(profileId, month, year),
    enabled: Boolean(profileId),
  });
}

async function fetchAllBudgets(profileId: string): Promise<Budget[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("profile_id", profileId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Lista TODAS as metas do perfil, sem filtro de mês/ano — diferente de
 * `useBudgets` (usado pelo Planejamento Mensal, que só precisa do período em
 * exibição). Existe só pro módulo de Exportação (Fase 9): "exportar meus
 * dados" precisa do histórico completo, não de um mês por vez. A query key
 * `["budgets", profileId, "all"]` compartilha o prefixo `["budgets",
 * profileId]` usado pelas invalidações de `useCreate/Update/DeleteBudget`
 * acima, então continua sendo invalidada automaticamente por elas.
 */
export function useAllBudgets(profileId: string) {
  return useQuery({
    queryKey: ["budgets", profileId, "all"] as const,
    queryFn: () => fetchAllBudgets(profileId),
    enabled: Boolean(profileId),
  });
}

export interface CreateBudgetInput {
  category_id: string;
  month: number;
  year: number;
  planned_amount: number;
}

export function useCreateBudget(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBudgetInput) => {
      const supabase = createClient();
      const payload: TablesInsert<"budgets"> = {
        ...input,
        profile_id: profileId,
      };
      const { data, error } = await supabase
        .from("budgets")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", profileId] });
    },
  });
}

export interface UpdateBudgetInput {
  id: string;
  planned_amount: number;
}

/** Edita só o valor planejado — categoria/mês/ano de uma meta não mudam depois de criada. */
export function useUpdateBudget(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, planned_amount }: UpdateBudgetInput) => {
      const supabase = createClient();
      const payload: TablesUpdate<"budgets"> = { planned_amount };
      const { data, error } = await supabase
        .from("budgets")
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
      queryClient.invalidateQueries({ queryKey: ["budgets", profileId] });
    },
  });
}

export function useDeleteBudget(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("budgets").delete().eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", profileId] });
    },
  });
}
