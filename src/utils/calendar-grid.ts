export interface CalendarTransaction {
  id: string;
  description: string;
  /** Valor com sinal — receita positiva, despesa negativa (mesma convenção de `transactions.amount`). */
  amount: number;
  /** Data no formato ISO `YYYY-MM-DD` (ou timestamp — só os 10 primeiros caracteres são usados). */
  date: string;
}

export interface CalendarDay {
  /** Data do dia no formato `YYYY-MM-DD`. */
  date: string;
  /** Dia do mês (1-31), para exibição. */
  day: number;
  /** `false` para dias de preenchimento do mês anterior/seguinte. */
  isCurrentMonth: boolean;
  isToday: boolean;
  transactions: CalendarTransaction[];
}

export type CalendarWeek = CalendarDay[];

const DAYS_PER_WEEK = 7;

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Monta a estrutura de um grid de calendário mensal (semanas × dias),
 * agrupando `transactions` pendentes no dia correspondente ao seu campo
 * `date`. Semanas começam no domingo e o grid sempre é completado com dias
 * do mês anterior/seguinte pra fechar múltiplos de 7 (`isCurrentMonth:
 * false` nesses casos, sempre sem transações).
 *
 * Função pura: usa `Date(year, monthIndex, offset)` (normalização nativa do
 * JS pra virada de mês/ano) em vez de aritmética manual de dias-no-mês, e
 * recebe `today` como parâmetro (default `new Date()`) pra ser 100%
 * testável sem depender do relógio real.
 */
export function buildCalendarGrid(
  month: number,
  year: number,
  transactions: CalendarTransaction[],
  today: Date = new Date(),
): CalendarWeek[] {
  const monthIndex = month - 1;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const totalDaysBeforeTrailing = firstWeekday + daysInMonth;
  const trailingDays =
    (DAYS_PER_WEEK - (totalDaysBeforeTrailing % DAYS_PER_WEEK)) %
    DAYS_PER_WEEK;

  const transactionsByDate = new Map<string, CalendarTransaction[]>();
  for (const transaction of transactions) {
    const key = transaction.date.slice(0, 10);
    const existing = transactionsByDate.get(key) ?? [];
    transactionsByDate.set(key, [...existing, transaction]);
  }

  const todayKey = toDateKey(today);
  const days: CalendarDay[] = [];

  for (
    let offset = 1 - firstWeekday;
    offset <= daysInMonth + trailingDays;
    offset += 1
  ) {
    const date = new Date(year, monthIndex, offset);
    const key = toDateKey(date);
    const isCurrentMonth = offset >= 1 && offset <= daysInMonth;

    days.push({
      date: key,
      day: date.getDate(),
      isCurrentMonth,
      isToday: key === todayKey,
      transactions: isCurrentMonth ? (transactionsByDate.get(key) ?? []) : [],
    });
  }

  const weeks: CalendarWeek[] = [];
  for (let i = 0; i < days.length; i += DAYS_PER_WEEK) {
    weeks.push(days.slice(i, i + DAYS_PER_WEEK));
  }

  return weeks;
}
