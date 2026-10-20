export type ReceiptOrigin = "domestic" | "foreign";

export interface ReceiptFilters {
  clientId: string | null;
  origin: ReceiptOrigin | null;
}

/** Filtra recebimentos por cliente e/ou origem do cliente. Não altera a lista de entrada. */
export function filterReceipts<T extends { client_id: string }>(
  receipts: readonly T[],
  filters: ReceiptFilters,
  originByClient: Readonly<Record<string, ReceiptOrigin>>,
): T[] {
  return receipts.filter((receipt) => {
    if (filters.clientId && receipt.client_id !== filters.clientId) {
      return false;
    }

    return !filters.origin || originByClient[receipt.client_id] === filters.origin;
  });
}
