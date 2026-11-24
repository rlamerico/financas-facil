"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeCardName } from "@/utils/cards/card-matching";
import {
  CARD_GROUPS,
  creditCardSchema,
  type CardGroup,
  type CreditCardInput,
} from "@/utils/validation/credit-card-schema";
import {
  CreditCardError,
  useCreateCreditCard,
  useUpdateCreditCard,
  type CreditCard,
} from "@/hooks/use-credit-cards";

interface CreditCardFormProps {
  profileId: string;
  /** `null` = modo criação; presente = modo edição. */
  card: CreditCard | null;
  onClose: () => void;
}

const GENERIC_SAVE_ERROR = "Não foi possível salvar o cartão. Tente novamente.";

const FIELD_CLASS =
  "mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function emptyToNull(value: string): string | null {
  return value.trim() === "" ? null : value;
}

/**
 * Radix `Dialog` para criar/editar cartão, mesmo padrão de `BankAccountForm`.
 * O final do cartão é a chave estável do módulo — daí o campo ficar ao lado do
 * nome e a UI mostrar, ainda no formulário, o apelido que será gravado.
 */
export function CreditCardForm({
  profileId,
  card,
  onClose,
}: CreditCardFormProps) {
  const isEditing = Boolean(card);

  const [name, setName] = useState(card?.name ?? "");
  const [lastFour, setLastFour] = useState(card?.last_four ?? "");
  const [issuer, setIssuer] = useState(card?.issuer ?? "");
  const [holderLabel, setHolderLabel] = useState(card?.holder_label ?? "");
  const [cardGroup, setCardGroup] = useState<CardGroup>(
    (card?.card_group as CardGroup) ?? "pessoal",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createCreditCard = useCreateCreditCard(profileId);
  const updateCreditCard = useUpdateCreditCard(profileId);
  const isSaving = createCreditCard.isPending || updateCreditCard.isPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input: CreditCardInput = {
      name,
      last_four: lastFour,
      issuer: emptyToNull(issuer),
      holder_label: emptyToNull(holderLabel),
      card_group: cardGroup,
      color: card?.color ?? null,
    };

    const result = creditCardSchema.safeParse(input);
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

    try {
      if (isEditing && card) {
        await updateCreditCard.mutateAsync({ id: card.id, ...result.data });
      } else {
        await createCreditCard.mutateAsync(result.data);
      }
      onClose();
    } catch (error) {
      setErrors({
        form:
          error instanceof CreditCardError ? error.message : GENERIC_SAVE_ERROR,
      });
    }
  };

  const previewAlias = normalizeCardName(name);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 shadow-overlay animate-fade-up">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              {isEditing ? "Editar cartão" : "Novo cartão"}
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
              <label htmlFor="credit-card-name" className="text-sm font-medium">
                Nome do cartão
              </label>
              <input
                id="credit-card-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex: Rodrigo C6 Ieda"
                className={FIELD_CLASS}
              />
              {!isEditing && previewAlias !== "" && (
                <p className="mt-1 text-xs text-muted">
                  Será salvo como apelido: <strong>{previewAlias}</strong>
                </p>
              )}
              {errors.name && (
                <p className="mt-1 text-xs text-error">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="credit-card-last-four"
                className="text-sm font-medium"
              >
                4 últimos dígitos
              </label>
              <input
                id="credit-card-last-four"
                value={lastFour}
                onChange={(event) => setLastFour(event.target.value)}
                inputMode="numeric"
                maxLength={4}
                placeholder="Ex: 3783"
                className={`${FIELD_CLASS} tabular-nums`}
              />
              <p className="mt-1 text-xs text-muted">
                É por este final que a importação reconhece o cartão.
              </p>
              {errors.last_four && (
                <p className="mt-1 text-xs text-error">{errors.last_four}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="credit-card-issuer"
                className="text-sm font-medium"
              >
                Emissor (opcional)
              </label>
              <input
                id="credit-card-issuer"
                value={issuer ?? ""}
                onChange={(event) => setIssuer(event.target.value)}
                placeholder="Ex: C6 Bank"
                className={FIELD_CLASS}
              />
            </div>

            <div>
              <label
                htmlFor="credit-card-holder"
                className="text-sm font-medium"
              >
                Titular / portador (opcional)
              </label>
              <input
                id="credit-card-holder"
                value={holderLabel ?? ""}
                onChange={(event) => setHolderLabel(event.target.value)}
                placeholder="Ex: Ieda"
                className={FIELD_CLASS}
              />
            </div>

            <div>
              <label
                htmlFor="credit-card-group"
                className="text-sm font-medium"
              >
                Grupo
              </label>
              <select
                id="credit-card-group"
                value={cardGroup}
                onChange={(event) =>
                  setCardGroup(event.target.value as CardGroup)
                }
                className={FIELD_CLASS}
              >
                {CARD_GROUPS.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>

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
