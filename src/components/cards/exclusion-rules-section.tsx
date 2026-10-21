"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { EmptyState } from "./empty-state";
import { ExclusionRuleForm } from "./exclusion-rule-form";
import { useCreditCards } from "@/hooks/use-credit-cards";
import {
  useCreateSuggestedExclusionRules,
  useDeleteExclusionRule,
  useExclusionRules,
  useExclusionRuleUsage,
  useUpdateExclusionRule,
  type ExclusionRuleCardOption,
  type ExclusionRuleRecord,
} from "@/hooks/use-exclusion-rules";

interface ExclusionRulesSectionProps {
  profileId: string;
}

type FormState = { mode: "create" } | { mode: "edit"; rule: ExclusionRuleRecord };

const DELETE_ERROR = "Não foi possível excluir a regra.";
const TOGGLE_ERROR = "Não foi possível alterar a regra.";
const SEED_ERROR = "Não foi possível criar as regras sugeridas.";

function describeRule(
  rule: ExclusionRuleRecord,
  cards: ExclusionRuleCardOption[],
): string {
  const criterion =
    rule.match_type === "negative_amount"
      ? "Valor negativo"
      : rule.match_type === "category_equals"
        ? `Categoria igual a “${rule.match_value}”`
        : `Descrição contém “${rule.match_value}”`;

  const card = cards.find((option) => option.id === rule.card_id);
  const scope = rule.card_id
    ? `Só no cartão ${card ? `${card.name} ·· ${card.last_four}` : "selecionado"}`
    : "Todos os cartões";

  return `${criterion} · ${scope}`;
}

function describeUsage(count: number): string {
  if (count === 0) return "Nenhum lançamento excluído ainda";
  if (count === 1) return "1 lançamento já excluído";
  return `${count} lançamentos já excluídos`;
}

/**
 * Gestão das regras de exclusão automática. Componente **autossuficiente**:
 * recebe só `profileId` e carrega tudo de que precisa — inclusive a lista de
 * cartões, que degrada para "todos os cartões" quando ainda não há nenhum.
 */
export function ExclusionRulesSection({ profileId }: ExclusionRulesSectionProps) {
  const { data: rules, isLoading, isError } = useExclusionRules(profileId);
  const { data: usage } = useExclusionRuleUsage(profileId);
  // Fonte única da lista de cartões: a mesma query do cadastro (spec 004).
  // Uma segunda query com chave própria ficaria obsoleta ao criar um cartão,
  // porque só `["credit-cards", profileId]` é invalidada nas mutations.
  const { data: cards } = useCreditCards(profileId);
  const createSuggested = useCreateSuggestedExclusionRules(profileId);
  const updateRule = useUpdateExclusionRule(profileId);
  const deleteRule = useDeleteExclusionRule(profileId);

  const [formState, setFormState] = useState<FormState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const ruleList = rules ?? [];
  const cardList = cards ?? [];
  const hasNoRules = !isLoading && !isError && ruleList.length === 0;

  const handleCreateSuggested = async () => {
    setActionError(null);
    try {
      await createSuggested.mutateAsync();
    } catch {
      setActionError(SEED_ERROR);
    }
  };

  const handleToggle = async (rule: ExclusionRuleRecord) => {
    setActionError(null);
    try {
      await updateRule.mutateAsync({ id: rule.id, is_active: !rule.is_active });
    } catch {
      setActionError(TOGGLE_ERROR);
    }
  };

  const handleDelete = async (rule: ExclusionRuleRecord) => {
    const confirmed = window.confirm(
      `Excluir a regra "${rule.name}"? Os lançamentos que ela já excluiu continuam excluídos — reinclua um a um se quiser trazê-los de volta.`,
    );
    if (!confirmed) return;

    setActionError(null);
    try {
      await deleteRule.mutateAsync(rule.id);
    } catch {
      setActionError(DELETE_ERROR);
    }
  };

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Regras de exclusão
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Marcam automaticamente como ignorados os lançamentos que não são
            gasto de verdade — pagamento da própria fatura, estorno de tarifa.
            Nada é apagado: a exclusão é sempre reversível.
          </p>
        </div>
        <Button type="button" onClick={() => setFormState({ mode: "create" })}>
          <Plus className="h-4 w-4" aria-hidden />
          Nova regra
        </Button>
      </div>

      {actionError && <p className="mt-2 text-sm text-error">{actionError}</p>}

      {isLoading && (
        <p className="mt-4 text-sm text-muted">Carregando regras...</p>
      )}

      {isError && (
        <p className="mt-4 text-sm text-error">
          Não foi possível carregar as regras de exclusão.
        </p>
      )}

      {hasNoRules && (
        <EmptyState
          className="mt-4"
          title="Nenhuma regra cadastrada"
          description="Podemos começar com quatro regras sugeridas, tiradas da sua planilha: pagamento de fatura, pagamento via QR Code, estorno de tarifa e lançamentos negativos (esta última já vem desativada, porque nem todo negativo é lixo). Você revisa e edita depois."
          action={
            <Button
              type="button"
              onClick={handleCreateSuggested}
              disabled={createSuggested.isPending}
            >
              {createSuggested.isPending
                ? "Criando..."
                : "Criar regras sugeridas"}
            </Button>
          }
        />
      )}

      {ruleList.length > 0 && (
        <>
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface shadow-card">
            {ruleList.map((rule) => (
              <li
                key={rule.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className="truncate">{rule.name}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        rule.is_active
                          ? "bg-primary/10 text-primary"
                          : "bg-border/60 text-muted",
                      )}
                    >
                      {rule.is_active ? "Ativa" : "Desativada"}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {describeRule(rule, cardList)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted tabular-nums">
                    {describeUsage(usage?.[rule.id] ?? 0)}
                  </p>
                </div>

                <div className="flex shrink-0 gap-3 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => handleToggle(rule)}
                    className="text-secondary hover:underline"
                  >
                    {rule.is_active ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormState({ mode: "edit", rule })}
                    className="text-secondary hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(rule)}
                    className="text-error hover:underline"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-2 text-xs text-muted">
            Quando duas regras casam com o mesmo lançamento, vence a primeira
            desta lista. Apagar uma regra não reinclui o que ela já excluiu — o
            motivo fica registrado no lançamento como histórico.
          </p>
        </>
      )}

      {formState && (
        <ExclusionRuleForm
          profileId={profileId}
          rule={formState.mode === "edit" ? formState.rule : null}
          cards={cardList}
          onClose={() => setFormState(null)}
        />
      )}
    </section>
  );
}
