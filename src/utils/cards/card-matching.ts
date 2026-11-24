import {
  normalizeCardName,
  normalizeLastFour,
} from "@/utils/card-import/normalize";

/**
 * A normalização canônica de nome de cartão mora no parser da importação
 * (`card-import/normalize`) e é apenas re-exportada aqui. Duplicar a função
 * faria o cadastro gravar um apelido que a importação nunca encontraria —
 * uma divergência silenciosa e difícil de achar.
 */
export { normalizeCardName, normalizeLastFour };

export interface MatchableCard {
  id: string;
  name: string;
  last_four: string;
  /** Apelidos já normalizados por `normalizeCardName`. */
  aliases: string[];
}

export type CardMatchedBy = "last_four" | "alias";

export type CardMatch = {
  card: MatchableCard;
  matchedBy: CardMatchedBy;
} | null;

export interface MatchableEntry {
  cardLastFour: string;
  cardNameNormalized: string;
}

/**
 * Resolve de qual cartão é um lançamento da fatura.
 *
 * O final do cartão vem primeiro porque é a única chave estável da planilha: o
 * mesmo plástico aparece com 7 nomes diferentes ao longo dos meses, mas o final
 * não muda. O apelido é só o plano B, para linhas em que o final veio vazio ou
 * corrompido.
 */
export function resolveCardByEntry(
  cards: MatchableCard[],
  entry: MatchableEntry,
): CardMatch {
  const hasLastFour = /\d/.test(String(entry.cardLastFour ?? ""));

  if (hasLastFour) {
    const lastFour = normalizeLastFour(entry.cardLastFour);
    const byLastFour = cards.find(
      (card) => normalizeLastFour(card.last_four) === lastFour,
    );
    if (byLastFour) {
      return { card: byLastFour, matchedBy: "last_four" };
    }
  }

  const alias = normalizeCardName(entry.cardNameNormalized);
  if (alias === "") {
    return null;
  }

  const byAlias = cards.find(
    (card) =>
      card.aliases.some(
        (candidate) => normalizeCardName(candidate) === alias,
      ) || normalizeCardName(card.name) === alias,
  );

  return byAlias ? { card: byAlias, matchedBy: "alias" } : null;
}
