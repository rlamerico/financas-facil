export interface FingerprintParts {
  purchaseDate: string;
  description: string;
  amount: number;
  cardLastFour: string;
  installmentCurrent: number | null;
  installmentTotal: number | null;
}

const NO_INSTALLMENT = "-";
const SEPARATOR = "|";

function formatInstallment(current: number | null, total: number | null): string {
  if (current === null || total === null) return NO_INSTALLMENT;
  return `${current}/${total}`;
}

/**
 * Chave natural do lançamento, sem o índice de ocorrência. É o que se conta
 * dentro de uma aba para descobrir a repetição de uma mesma compra.
 */
export function buildFingerprintBase(parts: FingerprintParts): string {
  return [
    parts.purchaseDate,
    parts.description,
    parts.amount.toFixed(2),
    parts.cardLastFour,
    formatInstallment(parts.installmentCurrent, parts.installmentTotal),
  ].join(SEPARATOR);
}

/**
 * Chave de dedupe de um lançamento dentro de uma fatura.
 *
 * NÃO é hash: é uma chave composta legível, o que torna divergência de
 * importação depurável a olho nu.
 *
 * O sufixo `#N` é o índice de ocorrência (1-based) da mesma chave dentro da
 * MESMA aba, e existe porque 32 linhas da planilha real repetem (data,
 * descrição, valor, cartão) sendo compras distintas — 3 pedágios VIASUL no
 * mesmo dia pelo mesmo valor. Sem o índice, a importação apagaria linhas
 * verdadeiras.
 *
 * Como o índice segue a ordem das linhas da aba, reimportar o mesmo arquivo
 * gera exatamente as mesmas chaves — é isso que dá idempotência (spec 006).
 */
export function buildFingerprint(parts: FingerprintParts, occurrence: number): string {
  return `${buildFingerprintBase(parts)}${SEPARATOR}#${occurrence}`;
}
