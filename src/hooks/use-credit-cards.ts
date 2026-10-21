"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/services/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import { normalizeCardName } from "@/utils/cards/card-matching";
import type { CreditCardInput } from "@/utils/validation/credit-card-schema";

export type CardAlias = Pick<Tables<"card_aliases">, "id" | "alias">;

/** Cartão já com os apelidos embutidos — uma query só, sem N+1 na listagem. */
export type CreditCard = Tables<"credit_cards"> & { card_aliases: CardAlias[] };

/** Código do Postgres para violação de unicidade (`UNIQUE (profile_id, alias)`). */
const UNIQUE_VIOLATION = "23505";

/**
 * Erro com mensagem já pronta para a tela. Existe para separar o que o usuário
 * pode entender e resolver (apelido repetido, cartão com faturas) de uma falha
 * crua do PostgREST, que a UI troca por um texto genérico.
 */
export class CreditCardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreditCardError";
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === UNIQUE_VIOLATION
  );
}

function creditCardsQueryKey(profileId: string) {
  return ["credit-cards", profileId] as const;
}

async function fetchCreditCards(profileId: string): Promise<CreditCard[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("credit_cards")
    .select("*, card_aliases(id, alias)")
    .eq("profile_id", profileId)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as CreditCard[];
}

export function useCreditCards(profileId: string) {
  return useQuery({
    queryKey: creditCardsQueryKey(profileId),
    queryFn: () => fetchCreditCards(profileId),
    enabled: Boolean(profileId),
  });
}

/**
 * Grava o apelido normalizado. Duplicata no mesmo perfil não é falha de
 * sistema: o apelido já aponta para algum cartão, então a mensagem diz isso em
 * vez de vazar o erro do Postgres.
 */
async function insertAlias(
  profileId: string,
  cardId: string,
  rawAlias: string,
) {
  const alias = normalizeCardName(rawAlias);
  if (alias === "") {
    throw new CreditCardError("Informe o apelido.");
  }

  const supabase = createClient();
  const payload: TablesInsert<"card_aliases"> = {
    profile_id: profileId,
    card_id: cardId,
    alias,
  };
  const { error } = await supabase.from("card_aliases").insert(payload);

  if (isUniqueViolation(error)) {
    throw new CreditCardError(
      `O apelido "${alias}" já está em uso por um cartão deste perfil.`,
    );
  }
  if (error) {
    throw error;
  }

  return alias;
}

export function useCreateCreditCard(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreditCardInput) => {
      const supabase = createClient();
      const payload: TablesInsert<"credit_cards"> = {
        ...input,
        profile_id: profileId,
      };
      const { data, error } = await supabase
        .from("credit_cards")
        .insert(payload)
        .select()
        .single();

      if (isUniqueViolation(error)) {
        throw new CreditCardError(
          `Já existe um cartão com final ${input.last_four} neste perfil.`,
        );
      }
      if (error) {
        throw error;
      }

      // O nome normalizado vira o primeiro apelido: é o que faz a importação
      // reconhecer o cartão sem exigir cadastro extra. Se só o apelido falhar,
      // o cartão continua criado — dá para adicionar o apelido pela linha.
      try {
        await insertAlias(profileId, data.id, data.name);
      } catch {
        // Silenciado de propósito: ver comentário acima.
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: creditCardsQueryKey(profileId),
      });
    },
  });
}

export interface UpdateCreditCardInput extends Partial<CreditCardInput> {
  id: string;
  is_active?: boolean;
}

export function useUpdateCreditCard(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateCreditCardInput) => {
      const supabase = createClient();
      const payload: TablesUpdate<"credit_cards"> = {
        ...input,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("credit_cards")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (isUniqueViolation(error)) {
        throw new CreditCardError(
          `Já existe um cartão com final ${input.last_four} neste perfil.`,
        );
      }
      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: creditCardsQueryKey(profileId),
      });
    },
  });
}

/**
 * Conta as faturas antes de excluir. O `ON DELETE CASCADE` da migration 009
 * apagaria fatura e lançamentos em silêncio — histórico de fatura não se
 * recupera, então a exclusão é bloqueada e o caminho passa a ser desativar.
 */
async function countStatements(cardId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("card_statements")
    .select("id", { count: "exact", head: true })
    .eq("card_id", cardId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export function useDeleteCreditCard(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const statementCount = await countStatements(id);
      if (statementCount > 0) {
        const plural =
          statementCount === 1 ? "fatura importada" : "faturas importadas";
        throw new CreditCardError(
          `Este cartão tem ${statementCount} ${plural}. Desative-o em vez de excluir.`,
        );
      }

      const supabase = createClient();
      const { error } = await supabase
        .from("credit_cards")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: creditCardsQueryKey(profileId),
      });
    },
  });
}

export interface AddCardAliasInput {
  cardId: string;
  alias: string;
}

export function useAddCardAlias(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, alias }: AddCardAliasInput) =>
      insertAlias(profileId, cardId, alias),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: creditCardsQueryKey(profileId),
      });
    },
  });
}

export function useRemoveCardAlias(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (aliasId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("card_aliases")
        .delete()
        .eq("id", aliasId)
        .eq("profile_id", profileId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: creditCardsQueryKey(profileId),
      });
    },
  });
}
