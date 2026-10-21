const CENTS_FACTOR = 100;
const RATE_DECIMAL_FACTOR = 1_000_000;
const PERCENT_FACTOR = 100;

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} deve ser um número finito maior que zero.`);
  }
}

/** Arredonda meio para cima em centavos; `EPSILON` corrige casos como 1.005 → 1.01. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * CENTS_FACTOR) / CENTS_FACTOR;
}

/** Valor em BRL de um valor em USD, com a cotação informada (BRL por USD). */
export function convertToBrl(amountUsd: number, rate: number): number {
  assertPositiveFinite(amountUsd, "Valor em USD");
  assertPositiveFinite(rate, "Cotação");

  return round2(amountUsd * rate);
}

/** Cotação efetiva (BRL por USD) com 6 casas decimais. */
export function impliedRate(amountUsd: number, amountBrl: number): number {
  assertPositiveFinite(amountUsd, "Valor em USD");
  assertPositiveFinite(amountBrl, "Valor em BRL");

  return (
    Math.round((amountBrl / amountUsd) * RATE_DECIMAL_FACTOR) /
    RATE_DECIMAL_FACTOR
  );
}

/** Desvio percentual da cotação efetiva em relação à PTAX de referência. */
export function rateDeviation(effective: number, ptax: number): number {
  assertPositiveFinite(effective, "Cotação efetiva");
  assertPositiveFinite(ptax, "PTAX");

  return round2(((effective - ptax) / ptax) * PERCENT_FACTOR);
}
