import type { ReactNode } from "react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  CreditCardError,
  useAddCardAlias,
  useCreateCreditCard,
  useCreditCards,
  useDeleteCreditCard,
} from "./use-credit-cards";

/**
 * Dublê do PostgREST: cada método da cadeia devolve o próprio builder e o
 * builder é "thenable", então `await from(...).delete().eq(...)` resolve no
 * resultado agendado — sem precisar saber em que ponto a cadeia termina.
 */
interface QueryResult {
  data?: unknown;
  error?: unknown;
  count?: number | null;
}

const CHAIN_METHODS = [
  "select",
  "eq",
  "order",
  "insert",
  "update",
  "delete",
  "single",
] as const;

type Builder = Record<string, ReturnType<typeof vi.fn>> & {
  then: (resolve: (value: QueryResult) => unknown) => Promise<unknown>;
};

function makeBuilder(result: QueryResult): Builder {
  const builder = {} as Builder;
  for (const method of CHAIN_METHODS) {
    builder[method] = vi.fn(() => builder);
  }
  builder.then = (resolve) => Promise.resolve(result).then(resolve);
  return builder;
}

const queues = new Map<string, QueryResult[]>();
const builders: { table: string; builder: Builder }[] = [];

function enqueue(table: string, ...results: QueryResult[]) {
  queues.set(table, [...(queues.get(table) ?? []), ...results]);
}

function builderFor(table: string): Builder | undefined {
  return builders.find((entry) => entry.table === table)?.builder;
}

const from = vi.fn((table: string) => {
  const next = queues.get(table)?.shift() ?? { data: [], error: null };
  const builder = makeBuilder(next);
  builders.push({ table, builder });
  return builder;
});

vi.mock("@/services/supabase/client", () => ({
  createClient: () => ({ from }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const PROFILE_ID = "profile-1";

const CARD_ROW = {
  id: "card-1",
  profile_id: PROFILE_ID,
  name: "Rodrigo C6 Ieda",
  last_four: "3783",
  issuer: null,
  holder_label: null,
  card_group: "pessoal",
  color: null,
  is_active: true,
  created_at: null,
  updated_at: null,
};

beforeEach(() => {
  queues.clear();
  builders.length = 0;
  from.mockClear();
});

describe("useCreditCards", () => {
  test("lista os cartões com os apelidos embutidos numa única query", async () => {
    // Arrange
    enqueue("credit_cards", {
      data: [
        { ...CARD_ROW, card_aliases: [{ id: "a1", alias: "RODRIGO C6 IEDA" }] },
      ],
      error: null,
    });

    // Act
    const { result } = renderHook(() => useCreditCards(PROFILE_ID), {
      wrapper,
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].card_aliases).toEqual([
      { id: "a1", alias: "RODRIGO C6 IEDA" },
    ]);
    expect(builderFor("credit_cards")?.select).toHaveBeenCalledWith(
      "*, card_aliases(id, alias)",
    );
  });
});

describe("useCreateCreditCard", () => {
  test("grava o nome normalizado como apelido inicial (CA-02)", async () => {
    // Arrange
    enqueue("credit_cards", { data: CARD_ROW, error: null });
    enqueue("card_aliases", { error: null });

    // Act
    const { result } = renderHook(() => useCreateCreditCard(PROFILE_ID), {
      wrapper,
    });
    await result.current.mutateAsync({
      name: "Rodrigo C6 Ieda",
      last_four: "3783",
      card_group: "pessoal",
    });

    // Assert
    expect(builderFor("card_aliases")?.insert).toHaveBeenCalledWith({
      profile_id: PROFILE_ID,
      card_id: "card-1",
      alias: "RODRIGO C6 IEDA",
    });
  });

  test("cartão continua criado quando só o apelido inicial falha", async () => {
    // Arrange — apelido já usado por outro cartão do perfil.
    enqueue("credit_cards", { data: CARD_ROW, error: null });
    enqueue("card_aliases", { error: { code: "23505" } });

    // Act
    const { result } = renderHook(() => useCreateCreditCard(PROFILE_ID), {
      wrapper,
    });
    const created = await result.current.mutateAsync({
      name: "Rodrigo C6 Ieda",
      last_four: "3783",
      card_group: "pessoal",
    });

    // Assert
    expect(created).toEqual(CARD_ROW);
  });

  test("final repetido vira mensagem amigável", async () => {
    enqueue("credit_cards", { data: null, error: { code: "23505" } });

    const { result } = renderHook(() => useCreateCreditCard(PROFILE_ID), {
      wrapper,
    });

    await expect(
      result.current.mutateAsync({
        name: "Outro",
        last_four: "3783",
        card_group: "pessoal",
      }),
    ).rejects.toThrow("Já existe um cartão com final 3783 neste perfil.");
  });
});

describe("useAddCardAlias", () => {
  test("normaliza o apelido antes de gravar", async () => {
    // Arrange
    enqueue("card_aliases", { error: null });

    // Act
    const { result } = renderHook(() => useAddCardAlias(PROFILE_ID), {
      wrapper,
    });
    await result.current.mutateAsync({
      cardId: "card-1",
      alias: " uber-ieda ",
    });

    // Assert
    expect(builderFor("card_aliases")?.insert).toHaveBeenCalledWith({
      profile_id: PROFILE_ID,
      card_id: "card-1",
      alias: "UBER IEDA",
    });
  });

  test("apelido duplicado (23505) vira mensagem amigável, não erro cru (CA-03)", async () => {
    // Arrange
    enqueue("card_aliases", {
      error: { code: "23505", message: "duplicate key value" },
    });

    // Act
    const { result } = renderHook(() => useAddCardAlias(PROFILE_ID), {
      wrapper,
    });
    const rejection = result.current.mutateAsync({
      cardId: "card-1",
      alias: "UBER-IEDA",
    });

    // Assert
    await expect(rejection).rejects.toBeInstanceOf(CreditCardError);
    await expect(rejection).rejects.toThrow(
      'O apelido "UBER IEDA" já está em uso por um cartão deste perfil.',
    );
  });
});

describe("useDeleteCreditCard", () => {
  test("bloqueia a exclusão quando o cartão tem faturas importadas (CA-04)", async () => {
    // Arrange
    enqueue("card_statements", { count: 2, error: null });

    // Act
    const { result } = renderHook(() => useDeleteCreditCard(PROFILE_ID), {
      wrapper,
    });
    const rejection = result.current.mutateAsync("card-1");

    // Assert
    await expect(rejection).rejects.toThrow(
      "Este cartão tem 2 faturas importadas. Desative-o em vez de excluir.",
    );
    expect(from).not.toHaveBeenCalledWith("credit_cards");
  });

  test("mensagem no singular com uma fatura só", async () => {
    enqueue("card_statements", { count: 1, error: null });

    const { result } = renderHook(() => useDeleteCreditCard(PROFILE_ID), {
      wrapper,
    });

    await expect(result.current.mutateAsync("card-1")).rejects.toThrow(
      "Este cartão tem 1 fatura importada. Desative-o em vez de excluir.",
    );
  });

  test("exclui quando não há fatura nenhuma (CA-04)", async () => {
    // Arrange
    enqueue("card_statements", { count: 0, error: null });
    enqueue("credit_cards", { error: null });

    // Act
    const { result } = renderHook(() => useDeleteCreditCard(PROFILE_ID), {
      wrapper,
    });
    await result.current.mutateAsync("card-1");

    // Assert
    expect(builderFor("credit_cards")?.delete).toHaveBeenCalled();
    expect(builderFor("credit_cards")?.eq).toHaveBeenCalledWith("id", "card-1");
  });
});
