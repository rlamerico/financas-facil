"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { createClient } from "@/services/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import { monthRange } from "@/utils/business/month-range";
import { businessReceiptSchema } from "@/utils/validation/business-schemas";

export type BusinessReceipt = Tables<"business_receipts">;

export type BusinessReceiptFormInput = z.input<typeof businessReceiptSchema>;

export type UpdateBusinessReceiptInput = BusinessReceiptFormInput & { id: string };

export interface BusinessReceiptsFilter {
  /** Mês no formato YYYY-MM; sem mês, lista todos os recebimentos. */
  month?: string;
}

function businessReceiptsQueryKey(companyId: string, filter: BusinessReceiptsFilter) {
  return ["business-receipts", companyId, filter.month ?? null] as const;
}

async function fetchBusinessReceipts(
  companyId: string,
  filter: BusinessReceiptsFilter,
): Promise<BusinessReceipt[]> {
  const supabase = createClient();
  const baseQuery = supabase
    .from("business_receipts")
    .select("*")
    .eq("company_id", companyId);

  const range = filter.month ? monthRange(filter.month) : null;
  const filteredQuery = range
    ? baseQuery.gte("received_on", range.from).lt("received_on", range.to)
    : baseQuery;

  const { data, error } = await filteredQuery.order("received_on", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/** Recebimentos da empresa, opcionalmente filtrados por mês. */
export function useBusinessReceipts(companyId: string, filter: BusinessReceiptsFilter = {}) {
  return useQuery({
    queryKey: businessReceiptsQueryKey(companyId, filter),
    queryFn: () => fetchBusinessReceipts(companyId, filter),
    enabled: Boolean(companyId),
  });
}

function invalidateReceipts(queryClient: ReturnType<typeof useQueryClient>, companyId: string) {
  queryClient.invalidateQueries({ queryKey: ["business-receipts", companyId] });
}

export function useCreateBusinessReceipt(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BusinessReceiptFormInput) => {
      const parsed = businessReceiptSchema.parse(input);
      const payload: TablesInsert<"business_receipts"> = {
        ...parsed,
        company_id: companyId,
      };
      const supabase = createClient();
      const { data, error } = await supabase
        .from("business_receipts")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => invalidateReceipts(queryClient, companyId),
  });
}

export function useUpdateBusinessReceipt(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateBusinessReceiptInput) => {
      const payload: TablesUpdate<"business_receipts"> = businessReceiptSchema.parse(input);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("business_receipts")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => invalidateReceipts(queryClient, companyId),
  });
}

export function useDeleteBusinessReceipt(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("business_receipts").delete().eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => invalidateReceipts(queryClient, companyId),
  });
}
