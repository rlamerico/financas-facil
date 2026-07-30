/**
 * Rótulos dos meses em pt-BR, indexados de 0-11 (índice + 1 = número do mês
 * usado em `transactions`/`budgets`, que seguem a convenção 1-12).
 * Extraído de `transactions-view.tsx` (Fase 2) pra ser reusado também pelas
 * telas de Metas e Planejamento Mensal (Fase 3) sem duplicar o array.
 */
export const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;
