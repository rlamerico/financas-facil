import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreditCardError, type CreditCard } from "@/hooks/use-credit-cards";
import { CreditCardsSection } from "./credit-cards-section";

const listResult = {
  data: [] as CreditCard[],
  isLoading: false,
  isError: false,
};
const createMutate = vi.fn();
const updateMutate = vi.fn();
const deleteMutate = vi.fn();
const addAliasMutate = vi.fn();
const removeAliasMutate = vi.fn();

vi.mock("@/hooks/use-credit-cards", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/hooks/use-credit-cards")>();
  return {
    ...actual,
    useCreditCards: () => listResult,
    useCreateCreditCard: () => ({
      mutateAsync: createMutate,
      isPending: false,
    }),
    useUpdateCreditCard: () => ({
      mutateAsync: updateMutate,
      isPending: false,
    }),
    useDeleteCreditCard: () => ({
      mutateAsync: deleteMutate,
      isPending: false,
    }),
    useAddCardAlias: () => ({ mutateAsync: addAliasMutate, isPending: false }),
    useRemoveCardAlias: () => ({
      mutateAsync: removeAliasMutate,
      isPending: false,
    }),
  };
});

function makeCard(overrides: Partial<CreditCard> = {}): CreditCard {
  return {
    id: "card-1",
    profile_id: "profile-1",
    name: "Rodrigo C6 Ieda",
    last_four: "3783",
    issuer: "C6 Bank",
    holder_label: "Ieda",
    card_group: "pessoal",
    color: null,
    is_active: true,
    created_at: null,
    updated_at: null,
    card_aliases: [{ id: "alias-1", alias: "RODRIGO C6 IEDA" }],
    ...overrides,
  };
}

function renderSection(cards: CreditCard[]) {
  listResult.data = cards;
  return render(<CreditCardsSection profileId="profile-1" />);
}

beforeEach(() => {
  vi.clearAllMocks();
  listResult.isLoading = false;
  listResult.isError = false;
});

describe("CreditCardsSection", () => {
  test("mostra estado vazio quando não há cartão cadastrado", () => {
    renderSection([]);

    expect(screen.getByText("Nenhum cartão cadastrado")).toBeInTheDocument();
  });

  test("agrupa os cartões em Pessoal e Empresa", () => {
    renderSection([
      makeCard(),
      makeCard({
        id: "card-2",
        name: "RPA SOLUCOES",
        last_four: "4281",
        card_group: "empresa",
        card_aliases: [],
      }),
    ]);

    expect(
      screen.getByRole("heading", { name: "Pessoal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Empresa" }),
    ).toBeInTheDocument();
    expect(screen.getByText("•••• 3783")).toBeInTheDocument();
  });

  test("abre o formulário de novo cartão (CA-01)", async () => {
    const user = userEvent.setup();
    renderSection([makeCard()]);

    await user.click(screen.getByRole("button", { name: /novo cartão/i }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Novo cartão");
  });

  test("'Desativar' inverte is_active do cartão (CA-01)", async () => {
    const user = userEvent.setup();
    renderSection([makeCard()]);

    await user.click(screen.getByRole("button", { name: "Desativar" }));

    expect(updateMutate).toHaveBeenCalledWith({
      id: "card-1",
      is_active: false,
    });
  });

  test("cartão inativo oferece 'Ativar' de volta", async () => {
    const user = userEvent.setup();
    renderSection([makeCard({ is_active: false })]);

    await user.click(screen.getByRole("button", { name: "Ativar" }));

    expect(updateMutate).toHaveBeenCalledWith({
      id: "card-1",
      is_active: true,
    });
  });

  test("exclusão bloqueada mostra o motivo em vez de erro cru (CA-04)", async () => {
    // Arrange
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    deleteMutate.mockRejectedValueOnce(
      new CreditCardError(
        "Este cartão tem 3 faturas importadas. Desative-o em vez de excluir.",
      ),
    );
    renderSection([makeCard()]);

    // Act
    await user.click(screen.getByRole("button", { name: "Excluir" }));

    // Assert
    expect(
      await screen.findByText(
        "Este cartão tem 3 faturas importadas. Desative-o em vez de excluir.",
      ),
    ).toBeInTheDocument();
  });

  test("exclusão cancelada no confirm não chama o delete", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderSection([makeCard()]);

    await user.click(screen.getByRole("button", { name: "Excluir" }));

    expect(deleteMutate).not.toHaveBeenCalled();
  });

  test("apelido repetido mostra mensagem amigável na linha (CA-03)", async () => {
    // Arrange
    const user = userEvent.setup();
    addAliasMutate.mockRejectedValueOnce(
      new CreditCardError(
        'O apelido "UBER IEDA" já está em uso por um cartão deste perfil.',
      ),
    );
    renderSection([makeCard()]);

    // Act
    await user.type(
      screen.getByLabelText("Novo apelido para Rodrigo C6 Ieda"),
      "UBER-IEDA",
    );
    await user.click(screen.getByRole("button", { name: /adicionar/i }));

    // Assert
    expect(
      await screen.findByText(
        'O apelido "UBER IEDA" já está em uso por um cartão deste perfil.',
      ),
    ).toBeInTheDocument();
  });

  test("remover apelido dispara a mutation com o id do apelido (CA-03)", async () => {
    const user = userEvent.setup();
    renderSection([makeCard()]);

    await user.click(
      screen.getByRole("button", { name: "Remover apelido RODRIGO C6 IEDA" }),
    );

    expect(removeAliasMutate).toHaveBeenCalledWith("alias-1");
  });
});
