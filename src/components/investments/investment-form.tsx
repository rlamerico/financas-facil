"use client";

import { useState, useId, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  investmentSchema,
  ASSET_TYPE_SUGGESTIONS,
  type InvestmentInput,
} from "@/utils/validation/investment-schema";
import {
  useCreateInvestment,
  useUpdateInvestment,
  type Investment,
} from "@/hooks/use-investments";

interface InvestmentFormProps {
  profileId: string;
  /** `null` = modo criação; presente = modo edição. */
  investment: Investment | null;
  onClose: () => void;
}

const GENERIC_SAVE_ERROR = "Não foi possível salvar o investimento. Tente novamente.";

/**
 * Radix `Dialog` usado tanto pra criar quanto editar um investimento.
 * `current_price` é opcional e editável manualmente — sem integração
 * automática de cotação nesta fase (decisão pendente do usuário sobre a
 * API de mercado a usar).
 */
export function InvestmentForm({
  profileId,
  investment,
  onClose,
}: InvestmentFormProps) {
  const isEditing = Boolean(investment);
  const assetTypeListId = useId();

  const [assetName, setAssetName] = useState(investment?.asset_name ?? "");
  const [assetType, setAssetType] = useState(investment?.asset_type ?? "");
  const [quantity, setQuantity] = useState(
    investment ? String(investment.quantity) : "",
  );
  const [averagePrice, setAveragePrice] = useState(
    investment ? String(investment.average_price) : "",
  );
  const [currentPrice, setCurrentPrice] = useState(
    investment?.current_price != null ? String(investment.current_price) : "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createInvestment = useCreateInvestment(profileId);
  const updateInvestment = useUpdateInvestment(profileId);
  const isSaving = createInvestment.isPending || updateInvestment.isPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input: InvestmentInput = {
      asset_name: assetName,
      asset_type: assetType,
      quantity: Number(quantity),
      average_price: Number(averagePrice),
      current_price: currentPrice.trim() === "" ? null : Number(currentPrice),
    };

    const result = investmentSchema.safeParse(input);
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
      if (isEditing && investment) {
        await updateInvestment.mutateAsync({ id: investment.id, ...result.data });
      } else {
        await createInvestment.mutateAsync(result.data);
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
              {isEditing ? "Editar investimento" : "Novo investimento"}
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
              <label htmlFor="investment-asset-name" className="text-sm font-medium">
                Ativo
              </label>
              <input
                id="investment-asset-name"
                value={assetName}
                onChange={(event) => setAssetName(event.target.value)}
                placeholder="Ex: Tesouro Selic 2029"
                className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              {errors.asset_name && (
                <p className="mt-1 text-xs text-error">{errors.asset_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="investment-asset-type" className="text-sm font-medium">
                Tipo
              </label>
              <input
                id="investment-asset-type"
                list={assetTypeListId}
                value={assetType}
                onChange={(event) => setAssetType(event.target.value)}
                placeholder="Ex: Renda Fixa"
                className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <datalist id={assetTypeListId}>
                {ASSET_TYPE_SUGGESTIONS.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
              {errors.asset_type && (
                <p className="mt-1 text-xs text-error">{errors.asset_type}</p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="investment-quantity" className="text-sm font-medium">
                  Quantidade
                </label>
                <input
                  id="investment-quantity"
                  type="number"
                  step="0.00000001"
                  min="0"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                {errors.quantity && (
                  <p className="mt-1 text-xs text-error">{errors.quantity}</p>
                )}
              </div>

              <div className="flex-1">
                <label htmlFor="investment-average-price" className="text-sm font-medium">
                  Preço médio
                </label>
                <input
                  id="investment-average-price"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={averagePrice}
                  onChange={(event) => setAveragePrice(event.target.value)}
                  className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                {errors.average_price && (
                  <p className="mt-1 text-xs text-error">{errors.average_price}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="investment-current-price" className="text-sm font-medium">
                Preço atual (opcional)
              </label>
              <input
                id="investment-current-price"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={currentPrice}
                onChange={(event) => setCurrentPrice(event.target.value)}
                className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <p className="mt-1 text-xs text-muted">
                Sem cotação automática — atualize manualmente quando souber o preço de mercado.
              </p>
              {errors.current_price && (
                <p className="mt-1 text-xs text-error">{errors.current_price}</p>
              )}
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
