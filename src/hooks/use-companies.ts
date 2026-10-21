"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { createClient } from "@/services/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import { companySchema } from "@/utils/validation/business-schemas";

export type Company = Tables<"companies">;

export type CompanyFormInput = z.input<typeof companySchema>;

export interface UpdateCompanyInput extends CompanyFormInput {
  id: string;
}

function companiesQueryKey(profileId: string) {
  return ["companies", profileId] as const;
}

async function fetchCompanies(profileId: string): Promise<Company[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("profile_id", profileId)
    .order("legal_name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/** Lista as empresas do perfil. A validação de entrada fica nas mutations. */
export function useCompanies(profileId: string) {
  return useQuery({
    queryKey: companiesQueryKey(profileId),
    queryFn: () => fetchCompanies(profileId),
    enabled: Boolean(profileId),
  });
}

export function useCreateCompany(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompanyFormInput) => {
      const parsed = companySchema.parse(input);
      const payload: TablesInsert<"companies"> = {
        ...parsed,
        profile_id: profileId,
      };
      const supabase = createClient();
      const { data, error } = await supabase
        .from("companies")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companiesQueryKey(profileId) });
    },
  });
}

export function useUpdateCompany(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateCompanyInput) => {
      const payload: TablesUpdate<"companies"> = companySchema.parse(input);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("companies")
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
      queryClient.invalidateQueries({ queryKey: companiesQueryKey(profileId) });
    },
  });
}

export function useDeleteCompany(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("companies").delete().eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companiesQueryKey(profileId) });
    },
  });
}
