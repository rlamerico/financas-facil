import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardsView } from "./cards-view";

const replace = vi.fn();
let currentParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => currentParams,
}));

function renderView(search = "") {
  currentParams = new URLSearchParams(search);
  return render(<CardsView profileId="profile-1" />);
}

/** A aba ativa é a única com `aria-selected="true"`. */
function activeTabName(): string | null {
  const selected = screen
    .getAllByRole("tab")
    .find((tab) => tab.getAttribute("aria-selected") === "true");
  return selected?.textContent ?? null;
}

describe("CardsView", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  test("abre em 'Resumo' quando a URL não traz a aba", () => {
    renderView();

    expect(activeTabName()).toBe("Resumo");
    expect(screen.getByText("Resumo em construção")).toBeInTheDocument();
  });

  test("abre na aba indicada pela URL", () => {
    renderView("?aba=longo-prazo");

    expect(activeTabName()).toBe("Longo prazo");
    expect(screen.getByText("Longo prazo em construção")).toBeInTheDocument();
  });

  test("aba inválida cai em 'Resumo' sem quebrar", () => {
    renderView("?aba=qualquer-coisa");

    expect(activeTabName()).toBe("Resumo");
    expect(screen.getByText("Resumo em construção")).toBeInTheDocument();
  });

  test("clicar numa aba troca o conteúdo e espelha a aba na URL", async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole("tab", { name: "Lançamentos" }));

    expect(activeTabName()).toBe("Lançamentos");
    expect(screen.getByText("Lançamentos em construção")).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/cartoes?aba=lancamentos", {
      scroll: false,
    });
  });

  test("as 4 abas do módulo estão disponíveis", () => {
    renderView();

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Resumo",
      "Lançamentos",
      "Longo prazo",
      "Cartões e regras",
    ]);
  });

  test("seta para a direita move a aba ativa (navegação por teclado)", async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole("tab", { name: "Resumo" }));
    await user.keyboard("{ArrowRight}");

    expect(activeTabName()).toBe("Lançamentos");
  });
});
