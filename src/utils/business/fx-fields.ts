import { convertToBrl, impliedRate } from "./convert-currency";

export type FxField = "usd" | "rate" | "brl";

export interface FxValues {
  usd: number | null;
  rate: number | null;
  brl: number | null;
}

function isPositive(value: number | null): value is number {
  return value !== null && value > 0;
}

/**
 * Mantém USD, cotação e BRL coerentes ao editar um deles: o campo que depende
 * do editado é recalculado. Não altera a entrada.
 */
export function recalculateFx(values: FxValues, changed: FxField): FxValues {
  const { usd, rate, brl } = values;

  if (!isPositive(usd)) {
    return { ...values };
  }

  if (changed === "rate" || (changed === "usd" && isPositive(rate))) {
    return isPositive(rate) ? { ...values, brl: convertToBrl(usd, rate) } : { ...values };
  }

  if (changed === "brl" || changed === "usd") {
    return isPositive(brl) ? { ...values, rate: impliedRate(usd, brl) } : { ...values };
  }

  return { ...values };
}
