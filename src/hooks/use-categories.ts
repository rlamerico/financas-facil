"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/services/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Category = Tables<"categories">;

const CATEGORIES_QUERY_KEY = ["categories"] as const;

async function fetchCategories(): Promise<Category[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Lista as categorias visíveis para o usuário logado (globais + próprias).
 * A filtragem por dono é feita pela policy de RLS de `categories`
 * (`profile_id IS NULL OR auth.uid() = dono`) — a query aqui não precisa
 * repetir esse filtro.
 */
export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: fetchCategories,
  });
}

export interface CreateCategoryInput {
  name: string;
  type: "income" | "expense";
  color?: string | null;
  icon?: string | null;
}

/**
 * Cria uma categoria própria (`profile_id` = perfil logado, `is_default`
 * sempre `false` — só a seed da Fase 2 cria categorias globais). A policy
 * de RLS `"Users can insert own categories"` (migration 004) já rejeita
 * qualquer tentativa de setar `is_default = true` a partir do client, isso
 * aqui é só a defesa de superfície (nem oferece a opção na UI).
 */
export function useCreateCategory(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const supabase = createClient();
      const payload: TablesInsert<"categories"> = {
        ...input,
        profile_id: profileId,
        is_default: false,
      };
      const { data, error } = await supabase
        .from("categories")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

export interface UpdateCategoryInput {
  id: string;
  name: string;
  type: "income" | "expense";
  color?: string | null;
  icon?: string | null;
}

/**
 * Edita uma categoria própria. RLS bloqueia no servidor se for `is_default`.
 * Sem parâmetro de perfil: a query key de categorias não é escopada por
 * perfil (`CATEGORIES_QUERY_KEY`) e o `UPDATE` já é resolvido por `id` +
 * RLS — nada aqui precisaria do `profileId`.
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateCategoryInput) => {
      const supabase = createClient();
      const payload: TablesUpdate<"categories"> = input;
      const { data, error } = await supabase
        .from("categories")
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
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

/**
 * Exclui uma categoria própria. Se a categoria estiver em uso (referenciada
 * por `transactions.category_id` ou `budgets.category_id`, ambas sem
 * `ON DELETE CASCADE`), o Postgres rejeita com violação de FK
 * (`code === "23503"`) — o caller decide a mensagem amigável. Sem parâmetro
 * de perfil pelo mesmo motivo de `useUpdateCategory`.
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("categories").delete().eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}
