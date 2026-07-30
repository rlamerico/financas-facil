"use client";

import { useEffect } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/services/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Transaction = Tables<"transactions">;

const DEFAULT_PAGE_SIZE = 20;

export interface TransactionFilters {
  /** 1-12. Combinado com `year` filtra por mês de competência. */
  month?: number;
  year?: number;
  categoryId?: string;
  type?: "income" | "expense";
  /** Data mínima (ISO `YYYY-MM-DD`), usada pelo Dashboard ("últimos 30 dias"). */
  sinceDate?: string;
  /** Filtra por `transactions.status` (ex.: `"pending"`), usado pelo Calendário de Contas. */
  status?: string;
}

function transactionsQueryKey(
  profileId: string,
  filters: TransactionFilters,
  pageSize: number,
) {
  return ["transactions", profileId, filters, pageSize] as const;
}

async function fetchTransactionsPage(
  profileId: string,
  filters: TransactionFilters,
  pageParam: number,
  pageSize: number,
): Promise<Transaction[]> {
  const supabase = createClient();
  let query = supabase
    .from("transactions")
    .select("*")
    .eq("profile_id", profileId)
    .order("date", { ascending: false })
    .range(pageParam * pageSize, pageParam * pageSize + pageSize - 1);

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.type === "income") {
    query = query.gt("amount", 0);
  } else if (filters.type === "expense") {
    query = query.lt("amount", 0);
  }

  if (filters.month && filters.year) {
    const start = `${filters.year}-${String(filters.month).padStart(2, "0")}-01`;
    const endMonth = filters.month === 12 ? 1 : filters.month + 1;
    const endYear = filters.month === 12 ? filters.year + 1 : filters.year;
    const end = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
    query = query.gte("date", start).lt("date", end);
  }

  if (filters.sinceDate) {
    query = query.gte("date", filters.sinceDate);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Lista transações do perfil com filtros + paginação "carregar mais"
 * (`useInfiniteQuery`). Assina Realtime (`postgres_changes`) e invalida a
 * query quando chega um evento — é isso que faz o Dashboard e a lista de
 * Transações atualizarem sozinhos quando o n8n (ou outra aba) insere uma
 * transação, sem refresh manual (PRD §6.3).
 */
export function useTransactions(
  profileId: string,
  filters: TransactionFilters = {},
  pageSize: number = DEFAULT_PAGE_SIZE,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!profileId) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`transactions-${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["transactions", profileId],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, queryClient]);

  return useInfiniteQuery({
    queryKey: transactionsQueryKey(profileId, filters, pageSize),
    queryFn: ({ pageParam }) =>
      fetchTransactionsPage(profileId, filters, pageParam, pageSize),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === pageSize ? allPages.length : undefined,
    enabled: Boolean(profileId),
  });
}

export interface CreateTransactionInput {
  description: string;
  amount: number;
  date: string;
  category_id?: string | null;
}

export function useCreateTransaction(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const supabase = createClient();
      const payload: TablesInsert<"transactions"> = {
        ...input,
        profile_id: profileId,
      };
      const { data, error } = await supabase
        .from("transactions")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", profileId] });
    },
  });
}

export interface UpdateTransactionInput {
  id: string;
  description: string;
  amount: number;
  date: string;
  category_id?: string | null;
}

export function useUpdateTransaction(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTransactionInput) => {
      const supabase = createClient();
      const payload: TablesUpdate<"transactions"> = input;
      const { data, error } = await supabase
        .from("transactions")
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
      queryClient.invalidateQueries({ queryKey: ["transactions", profileId] });
    },
  });
}

export function useDeleteTransaction(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", profileId] });
    },
  });
}
