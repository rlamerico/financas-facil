/**
 * Funções puras da reconciliação planilha → sistema (sync espelho).
 * Separadas do Route Handler pra serem testáveis sem Supabase.
 */

/** Normaliza nome de categoria pra matching case/acento-insensitive. */
export function normalizeCategoryName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export interface ResolvedDate {
  date: string;
  /** Data original quando a compra é de outro mês (parcelas). */
  originalDate: string | null;
}

/**
 * Regra de data do import: o mês/ano da aba mandam. Data presente e do
 * mesmo mês → mantida; ausente, inválida ou de outro mês → dia 1 do mês
 * da aba (a original é preservada pra compor a descrição).
 */
export function resolveTransactionDate(
  rawDate: string | null | undefined,
  month: number,
  year: number,
): ResolvedDate {
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;

  const match = rawDate ? /^(\d{4})-(\d{2})-(\d{2})/.exec(rawDate.trim()) : null;
  if (!match) {
    return { date: firstDay, originalDate: null };
  }

  const [isoDate, matchYear, matchMonth] = [match[0], match[1], match[2]];
  if (Number(matchYear) === year && Number(matchMonth) === month) {
    return { date: isoDate, originalDate: null };
  }

  return { date: firstDay, originalDate: isoDate };
}

/** Descrição final: a da planilha (ou a categoria) + data original se houver. */
export function buildDescription(
  category: string,
  description: string | null | undefined,
  originalDate: string | null,
): string {
  const base = description?.trim() || category.trim();
  return originalDate ? `${base} (compra em ${originalDate})` : base;
}

export interface DesiredTransaction {
  external_ref: string;
  description: string;
  amount: number;
  date: string;
  category_id: string | null;
  payment_method: string | null;
}

export interface ExistingTransaction extends DesiredTransaction {
  id: string;
}

export interface TransactionsDiff {
  toInsert: DesiredTransaction[];
  toUpdate: (DesiredTransaction & { id: string })[];
  toDeleteIds: string[];
}

/**
 * Espelho: compara o estado atual (transações `source='sheet'` do mês) com
 * o snapshot desejado, casando por `external_ref`. Linhas idênticas são
 * no-op — reenviar o mesmo snapshot não gera escrita nenhuma.
 */
export function diffTransactions(
  existing: ExistingTransaction[],
  desired: DesiredTransaction[],
): TransactionsDiff {
  const existingByRef = new Map(
    existing.map((transaction) => [transaction.external_ref, transaction]),
  );
  const desiredRefs = new Set(desired.map((transaction) => transaction.external_ref));

  const toInsert: DesiredTransaction[] = [];
  const toUpdate: (DesiredTransaction & { id: string })[] = [];

  for (const wanted of desired) {
    const current = existingByRef.get(wanted.external_ref);
    if (!current) {
      toInsert.push(wanted);
      continue;
    }

    const hasChanges =
      current.description !== wanted.description ||
      current.amount !== wanted.amount ||
      current.date !== wanted.date ||
      current.category_id !== wanted.category_id ||
      current.payment_method !== wanted.payment_method;

    if (hasChanges) {
      toUpdate.push({ ...wanted, id: current.id });
    }
  }

  const toDeleteIds = existing
    .filter((transaction) => !desiredRefs.has(transaction.external_ref))
    .map((transaction) => transaction.id);

  return { toInsert, toUpdate, toDeleteIds };
}
