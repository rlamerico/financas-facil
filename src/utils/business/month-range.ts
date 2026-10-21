const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const FIRST_DAY = "01";
const MONTHS_PER_YEAR = 12;

export interface MonthRange {
  /** Primeiro dia do mês, inclusivo (YYYY-MM-DD). */
  from: string;
  /** Primeiro dia do mês seguinte, exclusivo (YYYY-MM-DD). */
  to: string;
}

/** Mês `YYYY-MM` da data informada, no fuso local. */
export function formatMonthKey(date: Date): string {
  const monthNumber = date.getMonth() + 1;

  return `${date.getFullYear()}-${String(monthNumber).padStart(2, "0")}`;
}

/** Intervalo `[from, to)` de um mês `YYYY-MM`, pronto para filtrar `received_on`. */
export function monthRange(month: string): MonthRange {
  const match = MONTH_PATTERN.exec(month);

  if (!match) {
    throw new Error(`Mês inválido, use o formato AAAA-MM: ${month}`);
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  const isDecember = monthNumber === MONTHS_PER_YEAR;
  const nextYear = isDecember ? year + 1 : year;
  const nextMonth = isDecember ? 1 : monthNumber + 1;

  return {
    from: `${year}-${match[2]}-${FIRST_DAY}`,
    to: `${nextYear}-${String(nextMonth).padStart(2, "0")}-${FIRST_DAY}`,
  };
}
