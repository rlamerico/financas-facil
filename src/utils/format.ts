const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const DATE = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

const DATE_TIME = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/** Format a numeric amount as Brazilian Real (e.g. R$ 1.234,56). */
export function formatCurrency(amount: number): string {
  return BRL.format(amount);
}

/** Format a date (or ISO string) as dd/mm/aaaa. */
export function formatDate(date: Date | string): string {
  return DATE.format(typeof date === "string" ? new Date(date) : date);
}

/** Format a timestamp (or ISO string) as dd/mm/aaaa hh:mm. */
export function formatDateTime(date: Date | string): string {
  return DATE_TIME.format(typeof date === "string" ? new Date(date) : date);
}
