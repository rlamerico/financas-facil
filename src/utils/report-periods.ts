import { MONTH_LABELS } from "./month-labels";

export interface ReportPeriod {
  month: number;
  year: number;
  /** Ex.: "Jan/2026" — rótulo curto usado no eixo X dos gráficos. */
  label: string;
}

/**
 * Gera os últimos `count` períodos (mês/ano), em ordem cronológica
 * (mais antigo → mais recente), terminando no mês de `referenceDate`.
 * Usada pelos gráficos de barras (Planejado × Realizado) e linha (evolução
 * de saldo) dos Relatórios, que sempre olham pra uma janela fixa de meses.
 */
export function getLastMonthPeriods(
  referenceDate: Date,
  count: number,
): ReportPeriod[] {
  const referenceMonth = referenceDate.getMonth(); // 0-11
  const referenceYear = referenceDate.getFullYear();

  const periods: ReportPeriod[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const monthIndex = referenceMonth - offset;
    const year = referenceYear + Math.floor(monthIndex / 12);
    const month = ((monthIndex % 12) + 12) % 12;

    periods.push({
      month: month + 1,
      year,
      label: `${MONTH_LABELS[month].slice(0, 3)}/${year}`,
    });
  }

  return periods;
}
