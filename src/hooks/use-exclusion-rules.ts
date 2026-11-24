"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/services/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import type { ExclusionMatchType } from "@/utils/cards/exclusion-rules";

/** A coluna `match_type` é `TEXT` com CHECK no banco; aqui ela é estreitada
 *  para a união do domínio, que é o que `evaluateExclusion` consome. */
export interface ExclusionRuleRecord
  extends Omit<Tables<"card_exclusion_rules">, "match_type"> {
  match_type: ExclusionMatchType;
}

/** Forma mínima que o seletor "aplicar só a um cartão" precisa. O registro
 *  completo de `useCreditCards` a satisfaz estruturalmente — o tipo existe
 *  para o formulário não depender do shape inteiro do cadastro. */
export interface ExclusionRuleCardOption {
  id: string;
  name: string;
  last_four: string;
}

export function exclusionRulesQueryKey(profileId: string) {
  return ["exclusion-rules", profileId] as const;
}

function exclusionRuleUsageQueryKey(profileId: string) {
  return ["exclusion-rule-usage", profileId] as const;
}

async function fetchExclusionRules(
  profileId: string,
): Promise<ExclusionRuleRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("card_exclusion_rules")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ExclusionRuleRecord[];
}

/**
 * Lista as regras do perfil na ordem de criação — a mesma ordem em que
 * `evaluateExclusion` as percorre, então o que a tela mostra de cima para
 * baixo é a ordem real de precedência.
 */
export function useExclusionRules(profileId: string) {
  return useQuery({
    queryKey: exclusionRulesQueryKey(profileId),
    queryFn: () => fetchExclusionRules(profileId),
    enabled: Boolean(profileId),
  });
}

async function fetchExclusionRuleUsage(
  profileId: string,
): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("card_entries")
    .select("exclusion_rule_id")
    .eq("profile_id", profileId)
    .not("exclusion_rule_id", "is", null);

  if (error) {
    throw error;
  }

  return (data ?? []).reduce<Record<string, number>>((counts, row) => {
    const ruleId = row.exclusion_rule_id;
    if (!ruleId) return counts;
    return { ...counts, [ruleId]: (counts[ruleId] ?? 0) + 1 };
  }, {});
}

/** Quantos lançamentos cada regra já excluiu — é o número que denuncia uma
 *  regra ampla demais. */
export function useExclusionRuleUsage(profileId: string) {
  return useQuery({
    queryKey: exclusionRuleUsageQueryKey(profileId),
    queryFn: () => fetchExclusionRuleUsage(profileId),
    enabled: Boolean(profileId),
  });
}

export interface ExclusionRuleFields {
  name: string;
  match_type: ExclusionMatchType;
  match_value: string | null;
  card_id: string | null;
  is_active: boolean;
}

function invalidateExclusionRules(
  queryClient: ReturnType<typeof useQueryClient>,
  profileId: string,
) {
  queryClient.invalidateQueries({ queryKey: exclusionRulesQueryKey(profileId) });
  queryClient.invalidateQueries({
    queryKey: exclusionRuleUsageQueryKey(profileId),
  });
}

export function useCreateExclusionRule(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ExclusionRuleFields) => {
      const supabase = createClient();
      const payload: TablesInsert<"card_exclusion_rules"> = {
        ...input,
        profile_id: profileId,
      };
      const { data, error } = await supabase
        .from("card_exclusion_rules")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => invalidateExclusionRules(queryClient, profileId),
  });
}

export interface UpdateExclusionRuleInput extends Partial<ExclusionRuleFields> {
  id: string;
}

export function useUpdateExclusionRule(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateExclusionRuleInput) => {
      const supabase = createClient();
      const payload: TablesUpdate<"card_exclusion_rules"> = { ...input };
      const { data, error } = await supabase
        .from("card_exclusion_rules")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => invalidateExclusionRules(queryClient, profileId),
  });
}

export function useDeleteExclusionRule(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("card_exclusion_rules")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => invalidateExclusionRules(queryClient, profileId),
  });
}

/**
 * Sugestão de partida, derivada do arquivo real do usuário (2.704
 * lançamentos). São **dados**, não regra de negócio: nada disso entra no banco
 * sem o usuário clicar, e o avaliador não conhece nenhuma dessas descrições.
 *
 * "Lançamentos negativos" nasce **desativada** de propósito: dos 38 negativos
 * reais, uns são pagamento de fatura (lixo) e outros são estorno de compra
 * (informação legítima). Ligar por padrão esconderia dado de verdade.
 */
export const SUGGESTED_EXCLUSION_RULES: readonly ExclusionRuleFields[] = [
  {
    name: "Pagamento de fatura",
    match_type: "description_contains",
    match_value: "INCLUSAO DE PAGAMENTO",
    card_id: null,
    is_active: true,
  },
  {
    name: "Pagamento via QR Code",
    match_type: "description_contains",
    match_value: "PAGAMENTO FATURA QR CODE",
    card_id: null,
    is_active: true,
  },
  {
    name: "Estorno de tarifa",
    match_type: "description_contains",
    match_value: "ESTORNO TARIFA",
    card_id: null,
    is_active: true,
  },
  {
    name: "Lançamentos negativos",
    match_type: "negative_amount",
    match_value: null,
    card_id: null,
    is_active: false,
  },
] as const;

export function useCreateSuggestedExclusionRules(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const payload: TablesInsert<"card_exclusion_rules">[] =
        SUGGESTED_EXCLUSION_RULES.map((rule) => ({
          ...rule,
          profile_id: profileId,
        }));

      const { data, error } = await supabase
        .from("card_exclusion_rules")
        .insert(payload)
        .select();

      if (error) {
        throw error;
      }

      return data ?? [];
    },
    onSuccess: () => invalidateExclusionRules(queryClient, profileId),
  });
}
