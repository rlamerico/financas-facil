export type ExclusionMatchType =
  | "description_contains"
  | "category_equals"
  | "negative_amount";

export interface ExclusionRule {
  id: string;
  name: string;
  match_type: ExclusionMatchType;
  /** `null` quando `match_type = 'negative_amount'`. */
  match_value: string | null;
  /** `null` = a regra vale para todos os cartões. */
  card_id: string | null;
  is_active: boolean;
}

export interface ExclusionMatch {
  ruleId: string;
  ruleName: string;
  /** Texto legível guardado em `card_entries.exclusion_reason`. */
  reason: string;
}

export interface EvaluableEntry {
  description: string;
  categoryLabel: string | null;
  amount: number;
  cardId: string | null;
}

export interface EvaluatedEntry {
  isExcluded: boolean;
  exclusionRuleId: string | null;
  exclusionReason: string | null;
}

/**
 * Chave de comparação de texto: maiúsculo, sem acento, espaços colapsados,
 * `trim`. Existe aqui em vez de reusar `card-import/normalize.ts` porque a
 * avaliação de regras não depende do parser da planilha — ela roda também
 * sobre lançamentos que já estão no banco.
 *
 * O `trim` é o detalhe que faz `"Inclusao de Pagamento    "` (como vem da
 * planilha, com espaços à direita) casar com a regra `INCLUSAO DE PAGAMENTO`.
 */
export function normalizeText(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isRuleApplicable(rule: ExclusionRule, entry: EvaluableEntry): boolean {
  if (!rule.is_active) return false;
  return rule.card_id === null || rule.card_id === entry.cardId;
}

function doesRuleMatch(rule: ExclusionRule, entry: EvaluableEntry): boolean {
  if (rule.match_type === "negative_amount") {
    return entry.amount < 0;
  }

  const needle = normalizeText(rule.match_value);
  // Texto vazio casaria com tudo — regra sem valor é regra inválida, não curinga.
  if (needle === "") return false;

  if (rule.match_type === "description_contains") {
    return normalizeText(entry.description).includes(needle);
  }

  if (rule.match_type === "category_equals") {
    if (entry.categoryLabel === null) return false;
    return normalizeText(entry.categoryLabel) === needle;
  }

  return false;
}

/**
 * Devolve a **primeira** regra ativa e aplicável ao cartão que casar com o
 * lançamento, na ordem em que as regras vierem. Sem sistema de prioridade de
 * propósito: quem quiser mudar a ordem desativa e recria a regra.
 */
export function evaluateExclusion(
  entry: EvaluableEntry,
  rules: ExclusionRule[],
): ExclusionMatch | null {
  for (const rule of rules) {
    if (!isRuleApplicable(rule, entry)) continue;
    if (!doesRuleMatch(rule, entry)) continue;

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      reason: `Regra: ${rule.name}`,
    };
  }

  return null;
}

/**
 * Anota a lista inteira com o resultado da avaliação. Função pura: devolve
 * objetos novos e não toca no array de entrada — a importação (spec 006)
 * depende disso para poder comparar antes/depois.
 */
export function applyExclusionRules<T extends EvaluableEntry>(
  entries: T[],
  rules: ExclusionRule[],
): Array<T & EvaluatedEntry> {
  return entries.map((entry) => {
    const match = evaluateExclusion(entry, rules);

    return {
      ...entry,
      isExcluded: match !== null,
      exclusionRuleId: match?.ruleId ?? null,
      exclusionReason: match?.reason ?? null,
    };
  });
}
