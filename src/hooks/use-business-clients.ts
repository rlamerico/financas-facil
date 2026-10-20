"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { createClient } from "@/services/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import { businessClientSchema } from "@/utils/validation/business-schemas";

export type BusinessClient = Tables<"business_clients">;

export type BusinessClientFormInput = z.input<typeof businessClientSchema>;

export interface UpdateBusinessClientInput extends BusinessClientFormInput {
  id: string;
}

function businessClientsQueryKey(companyId: string) {
  return ["business-clients", companyId] as const;
}

async function fetchBusinessClients(companyId: string): Promise<BusinessClient[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("business_clients")
    .select("*")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/** Clientes PJ (Brasil e exterior) da empresa. */
export function useBusinessClients(companyId: string) {
  return useQuery({
    queryKey: businessClientsQueryKey(companyId),
    queryFn: () => fetchBusinessClients(companyId),
    enabled: Boolean(companyId),
  });
}

export function useCreateBusinessClient(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BusinessClientFormInput) => {
      const parsed = businessClientSchema.parse(input);
      const payload: TablesInsert<"business_clients"> = {
        ...parsed,
        company_id: companyId,
      };
      const supabase = createClient();
      const { data, error } = await supabase
        .from("business_clients")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessClientsQueryKey(companyId) });
    },
  });
}

export function useUpdateBusinessClient(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateBusinessClientInput) => {
      const payload: TablesUpdate<"business_clients"> = businessClientSchema.parse(input);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("business_clients")
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
      queryClient.invalidateQueries({ queryKey: businessClientsQueryKey(companyId) });
    },
  });
}

/** Excluir cliente com recebimentos falha pela FK `ON DELETE RESTRICT`; o erro sobe para a UI. */
export function useDeleteBusinessClient(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("business_clients").delete().eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessClientsQueryKey(companyId) });
    },
  });
}
