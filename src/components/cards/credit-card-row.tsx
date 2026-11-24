"use client";

import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { normalizeCardName } from "@/utils/cards/card-matching";
import { CARD_GROUPS } from "@/utils/validation/credit-card-schema";
import {
  CreditCardError,
  useAddCardAlias,
  useRemoveCardAlias,
  type CreditCard,
} from "@/hooks/use-credit-cards";

interface CreditCardRowProps {
  profileId: string;
  card: CreditCard;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

const GENERIC_ALIAS_ERROR =
  "Não foi possível salvar o apelido. Tente novamente.";

function groupLabel(value: string): string {
  return CARD_GROUPS.find((group) => group.value === value)?.label ?? value;
}

/**
 * Linha do cartão: identificação, grupo, estado e a lista de apelidos.
 *
 * Os apelidos ficam aqui — e não numa tela à parte — porque são a peça que faz
 * a importação reconhecer o cartão: quem vê "UBER-IEDA" numa fatura precisa
 * conseguir amarrá-lo ao plástico no mesmo lugar onde vê o final.
 */
export function CreditCardRow({
  profileId,
  card,
  onEdit,
  onDelete,
  onToggleActive,
}: CreditCardRowProps) {
  const [newAlias, setNewAlias] = useState("");
  const [aliasError, setAliasError] = useState<string | null>(null);

  const addAlias = useAddCardAlias(profileId);
  const removeAlias = useRemoveCardAlias(profileId);

  const handleAddAlias = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAliasError(null);

    try {
      await addAlias.mutateAsync({ cardId: card.id, alias: newAlias });
      setNewAlias("");
    } catch (error) {
      setAliasError(
        error instanceof CreditCardError ? error.message : GENERIC_ALIAS_ERROR,
      );
    }
  };

  const handleRemoveAlias = async (aliasId: string) => {
    setAliasError(null);

    try {
      await removeAlias.mutateAsync(aliasId);
    } catch {
      setAliasError("Não foi possível remover o apelido.");
    }
  };

  const details = [card.issuer, card.holder_label].filter(Boolean).join(" · ");
  const aliases = card.card_aliases ?? [];
  const aliasPreview = normalizeCardName(newAlias);

  return (
    <div className={cn("p-4", !card.is_active && "opacity-60")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              {card.name}
            </p>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted tabular-nums">
              •••• {card.last_four}
            </span>
            <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">
              {groupLabel(card.card_group)}
            </span>
            {!card.is_active && (
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-error">
                Inativo
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {details || "Sem detalhes adicionais"}
          </p>
        </div>

        <div className="flex shrink-0 gap-3 text-xs font-medium">
          <button
            type="button"
            onClick={onToggleActive}
            className="text-secondary hover:underline"
          >
            {card.is_active ? "Desativar" : "Ativar"}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="text-secondary hover:underline"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-error hover:underline"
          >
            Excluir
          </button>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-muted">Apelidos nas faturas</p>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {aliases.length === 0 && (
            <span className="text-xs text-muted">
              Nenhum apelido cadastrado.
            </span>
          )}
          {aliases.map((alias) => (
            <span
              key={alias.id}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-foreground"
            >
              {alias.alias}
              <button
                type="button"
                onClick={() => handleRemoveAlias(alias.id)}
                aria-label={`Remover apelido ${alias.alias}`}
                className="text-muted hover:text-error"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>

        <form
          onSubmit={handleAddAlias}
          className="mt-2 flex flex-wrap items-center gap-2"
        >
          <input
            value={newAlias}
            onChange={(event) => setNewAlias(event.target.value)}
            placeholder="Novo apelido (ex: UBER-IEDA)"
            aria-label={`Novo apelido para ${card.name}`}
            className="w-56 rounded-[var(--radius)] border border-border bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <button
            type="submit"
            disabled={addAlias.isPending}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
          >
            <Plus className="h-3 w-3" aria-hidden />
            Adicionar
          </button>
          {aliasPreview !== "" && aliasPreview !== newAlias.trim() && (
            <span className="text-xs text-muted">
              Será salvo como {aliasPreview}
            </span>
          )}
        </form>

        {aliasError && <p className="mt-1 text-xs text-error">{aliasError}</p>}
      </div>
    </div>
  );
}
