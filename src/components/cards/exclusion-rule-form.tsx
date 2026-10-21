"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EXCLUSION_MATCH_TYPES,
  EXCLUSION_MATCH_TYPE_LABELS,
  exclusionRuleSchema,
} from "@/utils/validation/exclusion-rule-schema";
import {
  useCreateExclusionRule,
  useUpdateExclusionRule,
  type ExclusionRuleCardOption,
  type ExclusionRuleFields,
  type ExclusionRuleRecord,
} from "@/hooks/use-exclusion-rules";
import type { ExclusionMatchType } from "@/utils/cards/exclusion-rules";

interface ExclusionRuleFormProps {
  profileId: string;
  /** `null` = modo criação; presente = modo edição. */
  rule: ExclusionRuleRecord | null;
  /** Vazia quando o perfil ainda não cadastrou cartões — o seletor degrada
   *  para "todos os cartões". */
  cards: ExclusionRuleCardOption[];
  onClose: () => void;
}

const ALL_CARDS = "all";
const GENERIC_SAVE_ERROR = "Não foi possível salvar a regra. Tente novamente.";

const INPUT_CLASS =
  "mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const MATCH_VALUE_HINTS: Record<ExclusionMatchType, string> = {
  description_contains:
    "Compara sem acento e sem diferenciar maiúsculas. Prefira o trecho mais específico: “PAGAMENTO” sozinho pegaria compras como “PAGAMENTO*CLINICA DE E”.",
  category_equals: "A categoria precisa ser exatamente igual a este texto.",
  negative_amount: "Casa qualquer lançamento com valor abaixo de zero.",
};

export function ExclusionRuleForm({
  profileId,
  rule,
  cards,
  onClose,
}: ExclusionRuleFormProps) {
  const isEditing = Boolean(rule);

  const [name, setName] = useState(rule?.name ?? "");
  const [matchType, setMatchType] = useState<ExclusionMatchType>(
    rule?.match_type ?? "description_contains",
  );
  const [matchValue, setMatchValue] = useState(rule?.match_value ?? "");
  const [cardId, setCardId] = useState(rule?.card_id ?? ALL_CARDS);
  const [isActive, setIsActive] = useState(rule?.is_active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createRule = useCreateExclusionRule(profileId);
  const updateRule = useUpdateExclusionRule(profileId);
  const isSaving = createRule.isPending || updateRule.isPending;
  const needsMatchValue = matchType !== "negative_amount";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = exclusionRuleSchema.safeParse({
      name,
      match_type: matchType,
      match_value: needsMatchValue ? matchValue : null,
      card_id: cardId === ALL_CARDS ? null : cardId,
      is_active: isActive,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    const fields: ExclusionRuleFields = {
      name: result.data.name,
      match_type: result.data.match_type,
      match_value: result.data.match_value ?? null,
      card_id: result.data.card_id ?? null,
      is_active: result.data.is_active,
    };

    try {
      if (isEditing && rule) {
        await updateRule.mutateAsync({ id: rule.id, ...fields });
      } else {
        await createRule.mutateAsync(fields);
      }
      onClose();
    } catch {
      setErrors({ form: GENERIC_SAVE_ERROR });
    }
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 shadow-overlay animate-fade-up">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              {isEditing ? "Editar regra de exclusão" : "Nova regra de exclusão"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="text-muted hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="exclusion-rule-name" className="text-sm font-medium">
                Nome da regra
              </label>
              <input
                id="exclusion-rule-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex: Pagamento de fatura"
                className={INPUT_CLASS}
              />
              {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="exclusion-rule-match-type" className="text-sm font-medium">
                Critério
              </label>
              <select
                id="exclusion-rule-match-type"
                value={matchType}
                onChange={(event) =>
                  setMatchType(event.target.value as ExclusionMatchType)
                }
                className={INPUT_CLASS}
              >
                {EXCLUSION_MATCH_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {EXCLUSION_MATCH_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            {needsMatchValue && (
              <div>
                <label
                  htmlFor="exclusion-rule-match-value"
                  className="text-sm font-medium"
                >
                  Texto a procurar
                </label>
                <input
                  id="exclusion-rule-match-value"
                  value={matchValue}
                  onChange={(event) => setMatchValue(event.target.value)}
                  placeholder="Ex: INCLUSAO DE PAGAMENTO"
                  className={INPUT_CLASS}
                />
                {errors.match_value && (
                  <p className="mt-1 text-xs text-error">{errors.match_value}</p>
                )}
              </div>
            )}

            <p className="text-xs text-muted">{MATCH_VALUE_HINTS[matchType]}</p>

            <div>
              <label htmlFor="exclusion-rule-card" className="text-sm font-medium">
                Aplicar a
              </label>
              <select
                id="exclusion-rule-card"
                value={cardId}
                onChange={(event) => setCardId(event.target.value)}
                disabled={cards.length === 0}
                className={INPUT_CLASS}
              >
                <option value={ALL_CARDS}>Todos os cartões</option>
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name} ·· {card.last_four}
                  </option>
                ))}
              </select>
              {cards.length === 0 && (
                <p className="mt-1 text-xs text-muted">
                  Nenhum cartão cadastrado ainda — a regra vale para todos.
                </p>
              )}
              {errors.card_id && (
                <p className="mt-1 text-xs text-error">{errors.card_id}</p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Regra ativa
            </label>

            {errors.form && <p className="text-sm text-error">{errors.form}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
