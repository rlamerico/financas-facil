"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/services/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type BankAccount = Tables<"bank_accounts">;

function bankAccountsQueryKey(profileId: string) {
  return ["bank-accounts", profileId] as const;
}

async function fetchBankAccounts(profileId: string): Promise<BankAccount[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("profile_id", profileId)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Lista as contas bancárias do perfil. Sem Realtime (mesmo padrão de
 * `useInvestments`/`useBudgets`): saldo muda por ação direta do usuário
 * nesta fase (sem conciliação bancária automática) — invalidação via
 * mutation já é suficiente.
 */
export function useBankAccounts(profileId: string) {
  return useQuery({
    queryKey: bankAccountsQueryKey(profileId),
    queryFn: () => fetchBankAccounts(profileId),
    enabled: Boolean(profileId),
  });
}

export interface CreateBankAccountInput {
  name: string;
  bank_name?: string | null;
  account_type?: string | null;
  balance: number;
}

export function useCreateBankAccount(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBankAccountInput) => {
      const supabase = createClient();
      const payload: TablesInsert<"bank_accounts"> = {
        ...input,
        profile_id: profileId,
      };
      const { data, error } = await supabase
        .from("bank_accounts")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankAccountsQueryKey(profileId) });
    },
  });
}

export interface UpdateBankAccountInput {
  id: string;
  name: string;
  bank_name?: string | null;
  account_type?: string | null;
  balance: number;
}

export function useUpdateBankAccount(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateBankAccountInput) => {
      const supabase = createClient();
      const payload: TablesUpdate<"bank_accounts"> = { ...input };
      const { data, error } = await supabase
        .from("bank_accounts")
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
      queryClient.invalidateQueries({ queryKey: bankAccountsQueryKey(profileId) });
    },
  });
}

export function useDeleteBankAccount(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("bank_accounts").delete().eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankAccountsQueryKey(profileId) });
    },
  });
}
