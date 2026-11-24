import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExclusionRulesSection } from "./exclusion-rules-section";
import {
  SUGGESTED_EXCLUSION_RULES,
  type ExclusionRuleRecord,
} from "@/hooks/use-exclusion-rules";

const createSuggested = vi.fn();

let rules: ExclusionRuleRecord[] = [];
let usage: Record<string, number> = {};

vi.mock("@/hooks/use-credit-cards", () => ({
  useCreditCards: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-exclusion-rules", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/hooks/use-exclusion-rules")>();

  return {
    ...actual,
    useExclusionRules: () => ({ data: rules, isLoading: false, isError: false }),
    useExclusionRuleUsage: () => ({ data: usage }),
    useCreateSuggestedExclusionRules: () => ({
      mutateAsync: createSuggested,
      isPending: false,
    }),
    useUpdateExclusionRule: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeleteExclusionRule: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useCreateExclusionRule: () => ({ mutateAsync: vi.fn(), isPending: false }),
  };
});

function makeRecord(overrides: Partial<ExclusionRuleRecord> = {}): ExclusionRuleRecord {
  return {
    id: "rule-1",
    profile_id: "profile-1",
    name: "Pagamento de fatura",
    match_type: "description_contains",
    match_value: "INCLUSAO DE PAGAMENTO",
    card_id: null,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("ExclusionRulesSection", () => {
  beforeEach(() => {
    createSuggested.mockClear();
    rules = [];
    usage = {};
  });

  test("oferece as regras sugeridas quando o perfil não tem nenhuma regra", () => {
    render(<ExclusionRulesSection profileId="profile-1" />);

    expect(
      screen.getByRole("button", { name: "Criar regras sugeridas" }),
    ).toBeInTheDocument();
  });

  test("não oferece as sugeridas quando já existe regra cadastrada", () => {
    rules = [makeRecord()];

    render(<ExclusionRulesSection profileId="profile-1" />);

    expect(
      screen.queryByRole("button", { name: "Criar regras sugeridas" }),
    ).not.toBeInTheDocument();
  });

  test("nada entra no banco antes do clique", async () => {
    const user = userEvent.setup();
    render(<ExclusionRulesSection profileId="profile-1" />);

    expect(createSuggested).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Criar regras sugeridas" }));

    expect(createSuggested).toHaveBeenCalledTimes(1);
  });

  test("o seed são exatamente as 4 regras, com a de negativos inativa", () => {
    expect(SUGGESTED_EXCLUSION_RULES).toEqual([
      {
        name: "Pagamento de fatura",
        match_type: "description_contains",
        match_value: "INCLUSAO DE PAGAMENTO",
        card_id: null,
        is_active: true,
      },
      {
        name: "Pagamento via QR Code",
        match_type: "description_contains",
        match_value: "PAGAMENTO FATURA QR CODE",
        card_id: null,
        is_active: true,
      },
      {
        name: "Estorno de tarifa",
        match_type: "description_contains",
        match_value: "ESTORNO TARIFA",
        card_id: null,
        is_active: true,
      },
      {
        name: "Lançamentos negativos",
        match_type: "negative_amount",
        match_value: null,
        card_id: null,
        is_active: false,
      },
    ]);
  });

  test("mostra a contagem de lançamentos que cada regra já excluiu", () => {
    rules = [
      makeRecord({ id: "rule-1", name: "Pagamento de fatura" }),
      makeRecord({ id: "rule-2", name: "Estorno de tarifa" }),
      makeRecord({ id: "rule-3", name: "Pagamento via QR Code" }),
    ];
    usage = { "rule-1": 21, "rule-2": 1 };

    render(<ExclusionRulesSection profileId="profile-1" />);

    expect(screen.getByText("21 lançamentos já excluídos")).toBeInTheDocument();
    expect(screen.getByText("1 lançamento já excluído")).toBeInTheDocument();
    expect(screen.getByText("Nenhum lançamento excluído ainda")).toBeInTheDocument();
  });

  test("marca visualmente a regra desativada", () => {
    rules = [makeRecord({ is_active: false })];

    render(<ExclusionRulesSection profileId="profile-1" />);

    expect(screen.getByText("Desativada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ativar" })).toBeInTheDocument();
  });

  test("descreve o critério e o alcance da regra", () => {
    rules = [makeRecord()];

    render(<ExclusionRulesSection profileId="profile-1" />);

    expect(
      screen.getByText("Descrição contém “INCLUSAO DE PAGAMENTO” · Todos os cartões"),
    ).toBeInTheDocument();
  });
});
