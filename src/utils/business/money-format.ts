const USD_FORMATTER = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" });
const RATE_FORMATTER = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 6,
});

/** Valor em dólar no padrão pt-BR, ex.: US$ 1.000,00. */
export function formatUsd(amount: number): string {
  return USD_FORMATTER.format(amount);
}

/** Cotação com vírgula decimal, entre 4 e 6 casas, ex.: 5,4321. */
export function formatRate(rate: number): string {
  return RATE_FORMATTER.format(rate);
}
