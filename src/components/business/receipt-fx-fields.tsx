"use client";

import type { FxField } from "@/utils/business/fx-fields";
import { rateDeviation } from "@/utils/business/convert-currency";
import type { PtaxResult } from "@/utils/business/ptax";
import { Button } from "@/components/ui/button";

export interface FxInputs {
  usd: string;
  rate: string;
  brl: string;
}

interface ReceiptFxFieldsProps {
  inputs: FxInputs;
  ptax: PtaxResult | undefined;
  ptaxLoading: boolean;
  ptaxError: boolean;
  errors: Record<string, string>;
  onChange: (field: FxField, raw: string) => void;
  onUsePtax: () => void;
}

const INPUT_CLASS =
  "mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const RATE_DECIMALS = 4;
const DEVIATION_DECIMALS = 2;

function formatPtDecimal(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(".", ",");
}

function formatIsoAsBr(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");

  return `${day}/${month}/${year}`;
}

interface PtaxHintProps {
  ptax: PtaxResult | undefined;
  loading: boolean;
  error: boolean;
  rate: number | null;
  onUse: () => void;
}

function PtaxHint({ ptax, loading, error, rate, onUse }: PtaxHintProps) {
  if (loading) {
    return <p className="mt-1 text-xs text-muted">Buscando a PTAX do dia...</p>;
  }

  if (error || !ptax) {
    return <p className="mt-1 text-xs text-muted">PTAX indisponível. Digite a cotação manualmente.</p>;
  }

  const isBusinessDayFallback = ptax.effectiveDate !== ptax.requestedDate;
  const deviation = rate !== null && rate > 0 ? rateDeviation(rate, ptax.sell) : null;

  return (
    <div className="mt-1 space-y-1 text-xs text-muted">
      <p>
        PTAX de {formatIsoAsBr(ptax.effectiveDate)}
        {isBusinessDayFallback ? " (último dia útil)" : ""}: R${" "}
        {formatPtDecimal(ptax.sell, RATE_DECIMALS)}
      </p>
      {deviation !== null && (
        <p>
          Cotação {deviation >= 0 ? "+" : ""}
          {formatPtDecimal(deviation, DEVIATION_DECIMALS)}% em relação à PTAX
        </p>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={onUse} className="px-0">
        Usar PTAX como cotação
      </Button>
    </div>
  );
}

/** Campos de câmbio: USD, cotação e BRL recebido. Editar um recalcula o outro. */
export function ReceiptFxFields({
  inputs,
  ptax,
  ptaxLoading,
  ptaxError,
  errors,
  onChange,
  onUsePtax,
}: ReceiptFxFieldsProps) {
  const rate = inputs.rate === "" ? null : Number(inputs.rate);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="receipt-usd" className="text-sm font-medium">
          Valor recebido (US$)
        </label>
        <input
          id="receipt-usd"
          type="number"
          step="0.01"
          inputMode="decimal"
          value={inputs.usd}
          onChange={(event) => onChange("usd", event.target.value)}
          className={INPUT_CLASS}
        />
        {errors.amount_original && <p className="mt-1 text-xs text-error">{errors.amount_original}</p>}
      </div>

      <div>
        <label htmlFor="receipt-rate" className="text-sm font-medium">
          Cotação efetiva (R$ por US$)
        </label>
        <input
          id="receipt-rate"
          type="number"
          step="0.0001"
          inputMode="decimal"
          value={inputs.rate}
          onChange={(event) => onChange("rate", event.target.value)}
          className={INPUT_CLASS}
        />
        {errors.exchange_rate && <p className="mt-1 text-xs text-error">{errors.exchange_rate}</p>}
        <PtaxHint ptax={ptax} loading={ptaxLoading} error={ptaxError} rate={rate} onUse={onUsePtax} />
      </div>

      <div>
        <label htmlFor="receipt-brl" className="text-sm font-medium">
          Valor recebido em BRL (o que vai para a contabilidade)
        </label>
        <input
          id="receipt-brl"
          type="number"
          step="0.01"
          inputMode="decimal"
          value={inputs.brl}
          onChange={(event) => onChange("brl", event.target.value)}
          className={INPUT_CLASS}
        />
        <p className="mt-1 text-xs text-muted">
          Edite com o valor efetivamente creditado; a cotação é recalculada.
        </p>
        {errors.amount_brl && <p className="mt-1 text-xs text-error">{errors.amount_brl}</p>}
      </div>
    </div>
  );
}
