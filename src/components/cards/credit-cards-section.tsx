"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CARD_GROUPS } from "@/utils/validation/credit-card-schema";
import {
  CreditCardError,
  useCreditCards,
  useDeleteCreditCard,
  useUpdateCreditCard,
  type CreditCard,
} from "@/hooks/use-credit-cards";
import { CreditCardForm } from "./credit-card-form";
import { CreditCardRow } from "./credit-card-row";
import { EmptyState } from "./empty-state";

interface CreditCardsSectionProps {
  profileId: string;
}

type FormState = { mode: "create" } | { mode: "edit"; card: CreditCard };

const GENERIC_DELETE_ERROR = "Não foi possível excluir o cartão.";

/**
 * Conteúdo da aba "Cartões": CRUD dos plásticos e dos apelidos que a
 * importação usa para reconhecê-los.
 *
 * A lista é agrupada por `card_group` porque é assim que o usuário fecha as
 * contas hoje ("Compras Pessoais" × "RPA" na planilha).
 */
export function CreditCardsSection({ profileId }: CreditCardsSectionProps) {
  const { data: cards, isLoading, isError } = useCreditCards(profileId);
  const updateCreditCard = useUpdateCreditCard(profileId);
  const deleteCreditCard = useDeleteCreditCard(profileId);

  const [formState, setFormState] = useState<FormState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const groups = useMemo(
    () =>
      CARD_GROUPS.map((group) => ({
        ...group,
        cards: (cards ?? []).filter((card) => card.card_group === group.value),
      })).filter((group) => group.cards.length > 0),
    [cards],
  );

  const handleToggleActive = async (card: CreditCard) => {
    setActionError(null);

    try {
      await updateCreditCard.mutateAsync({
        id: card.id,
        is_active: !card.is_active,
      });
    } catch {
      setActionError("Não foi possível alterar o estado do cartão.");
    }
  };

  const handleDelete = async (card: CreditCard) => {
    const confirmed = window.confirm(`Excluir o cartão "${card.name}"?`);
    if (!confirmed) {
      return;
    }

    setActionError(null);

    try {
      await deleteCreditCard.mutateAsync(card.id);
    } catch (error) {
      setActionError(
        error instanceof CreditCardError ? error.message : GENERIC_DELETE_ERROR,
      );
    }
  };

  const hasCards = (cards ?? []).length > 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Cartões</h2>
          <p className="text-sm text-muted">
            O final de 4 dígitos é o que amarra cada gasto ao plástico certo; os
            apelidos cobrem os nomes que a fatura usa para o mesmo cartão.
          </p>
        </div>
        <Button type="button" onClick={() => setFormState({ mode: "create" })}>
          <Plus className="h-4 w-4" aria-hidden />
          Novo cartão
        </Button>
      </div>

      {actionError && <p className="mt-3 text-sm text-error">{actionError}</p>}

      {isLoading && (
        <p className="mt-4 text-sm text-muted">Carregando cartões...</p>
      )}

      {isError && (
        <p className="mt-4 text-sm text-error">
          Não foi possível carregar os cartões.
        </p>
      )}

      {!isLoading && !isError && !hasCards && (
        <EmptyState
          className="mt-4"
          title="Nenhum cartão cadastrado"
          description="Cadastre seus cartões com os 4 últimos dígitos para que a importação de faturas saiba de qual plástico é cada gasto."
          action={
            <Button
              type="button"
              onClick={() => setFormState({ mode: "create" })}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Novo cartão
            </Button>
          }
        />
      )}

      {groups.map((group) => (
        <section key={group.value} className="mt-6">
          <h3 className="text-sm font-semibold text-muted">{group.label}</h3>
          <div className="mt-2 divide-y divide-border rounded-lg border border-border bg-surface shadow-card">
            {group.cards.map((card) => (
              <CreditCardRow
                key={card.id}
                profileId={profileId}
                card={card}
                onEdit={() => setFormState({ mode: "edit", card })}
                onDelete={() => handleDelete(card)}
                onToggleActive={() => handleToggleActive(card)}
              />
            ))}
          </div>
        </section>
      ))}

      {formState && (
        <CreditCardForm
          profileId={profileId}
          card={formState.mode === "edit" ? formState.card : null}
          onClose={() => setFormState(null)}
        />
      )}
    </div>
  );
}
