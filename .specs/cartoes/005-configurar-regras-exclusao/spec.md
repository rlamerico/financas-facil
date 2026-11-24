# [005] Configurar regras de exclusão automática

## Objetivo
Permitir que o usuário cadastre regras que marcam automaticamente como
"ignorado" os lançamentos que ele hoje apaga na mão da planilha — pagamentos de
fatura, estornos e o que mais ele não quer somando nas contas.

## Contexto

O **Finanças Fácil** (Next.js 16 App Router + Supabase) está ganhando um módulo
de Faturas de Cartão de Crédito que substitui a planilha do usuário.

**O problema:** hoje, toda vez que o usuário importa a fatura na planilha, ele
apaga manualmente as linhas que não são gasto de verdade. Analisando o arquivo
real (2.704 lançamentos), os candidatos óbvios são:

| Descrição | Ocorrências | Natureza |
|---|---|---|
| `Inclusao de Pagamento` | 21 | pagamento da própria fatura |
| `Estorno Tarifa` | 4 | estorno |
| `Pagamento Fatura QR CODE` | 2 | pagamento da própria fatura |
| `PAGAMENTO*CLINICA DE E` | 1 | (é compra — **não** deve ser excluída) |

E, de forma mais ampla, **38 lançamentos têm valor negativo** — estornos de
compra e pagamentos. Nem todo negativo é lixo (um estorno de compra pode ser
exatamente o que o usuário quer ver), então a regra por valor negativo existe
mas nasce **desativada**.

Repare no falso positivo: `PAGAMENTO*CLINICA DE E` contém "pagamento" e é uma
compra legítima. Regra baseada em substring precisa ser explícita e revisável —
por isso ela é **dado no banco**, editável pelo usuário, e nunca hardcode.

**Exclusão é sempre reversível.** O lançamento nunca é apagado: ele recebe
`is_excluded = true` + `exclusion_reason` + `excluded_by = 'rule'` +
`exclusion_rule_id`. O usuário pode reincluir a qualquer momento (spec 007) e o
total da fatura se ajusta sozinho.

### O que já existe

A migration `009_credit_cards.sql` (spec 001) já criou:

```sql
card_exclusion_rules (
  id, profile_id, name,
  match_type TEXT CHECK (match_type IN ('description_contains','category_equals','negative_amount')),
  match_value TEXT,          -- NULL quando match_type = 'negative_amount'
  card_id UUID,              -- NULL = vale para todos os cartões
  is_active BOOLEAN DEFAULT true,
  created_at
)
```

E, em `card_entries`: `is_excluded`, `exclusion_reason`,
`excluded_by ('manual'|'rule')`, `exclusion_rule_id`. Ambas com RLS por
`profile_id`.

A spec 002 entregou o parser (`src/utils/card-import/`), que produz
`ParsedEntry` com `description` já com `trim()` aplicado — detalhe que importa,
porque na planilha a descrição vem como `"Inclusao de Pagamento    "`, com
espaços à direita.

### Convenções obrigatórias do projeto

- Hooks React Query em `src/hooks/use-*.ts`, padrão de `use-bank-accounts.ts`.
- Zod em `src/utils/validation/`, com teste ao lado.
- A avaliação das regras é **função pura** em `src/utils/cards/`, testável sem
  banco e sem React — é ela que a importação (spec 006) chama.

## Stack
- **Linguagem**: TypeScript 5 (strict)
- **Framework**: Next.js 16 (App Router), React 19
- **Banco de dados**: Supabase (PostgreSQL + RLS)
- **Libs relevantes**: `@tanstack/react-query`, `zod`, `vitest`
- **Variáveis de ambiente necessárias**: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `001-modelar-schema-cartoes` — tabela `card_exclusion_rules` e colunas de
      exclusão em `card_entries`
- [ ] `002-parsear-planilha-fatura` — o tipo `ParsedEntry`, que é a entrada da
      avaliação de regras

Pré-condição verificável: `Tables<"card_exclusion_rules">` existe em
`src/types/database.ts` e `src/utils/card-import/types.ts` exporta `ParsedEntry`.

## O que implementar

### Arquivos a CRIAR
- `src/utils/cards/exclusion-rules.ts` — avaliação pura das regras
- `src/utils/cards/exclusion-rules.test.ts`
- `src/utils/validation/exclusion-rule-schema.ts`
- `src/utils/validation/exclusion-rule-schema.test.ts`
- `src/hooks/use-exclusion-rules.ts` — CRUD via React Query
- `src/components/cards/exclusion-rules-section.tsx` — UI de gestão das regras
- `src/components/cards/exclusion-rule-form.tsx`

### Arquivos a MODIFICAR
> **Nenhum.** A spec 004 roda em paralelo e é dona de
> `credit-cards-section.tsx` e `cards-view.tsx`. Dois agentes editando o mesmo
> arquivo é conflito garantido, então esta spec entrega
> `ExclusionRulesSection` como componente **autossuficiente e exportado**, e a
> ligação dele na aba "Cartões e regras" é feita pelo orquestrador depois que
> as duas specs pousarem.
>
> `ExclusionRulesSection` recebe apenas `{ profileId: string }` e não depende de
> nada da spec 004 — inclusive o seletor "aplicar só a um cartão" deve degradar
> para "todos os cartões" quando a lista de cartões vier vazia.

### Lógica principal

1. `evaluateExclusion(entry, rules)` percorre as regras **ativas** aplicáveis
   ao cartão do lançamento (`rule.card_id === null` ou igual ao cartão) e
   devolve a **primeira** que casar, na ordem em que vierem:
   - `description_contains`: `normalizeText(entry.description).includes(normalizeText(rule.match_value))`
   - `category_equals`: `normalizeText(entry.categoryLabel) === normalizeText(rule.match_value)`
   - `negative_amount`: `entry.amount < 0`
   `normalizeText` = maiúsculo, sem acento, espaços colapsados, `trim`.
2. Retorna `{ ruleId, ruleName, reason } | null`. `reason` é legível pelo
   humano: `"Regra: Pagamento de fatura"`.
3. `applyExclusionRules(entries, rules)` mapeia a lista inteira, devolvendo
   cada entry com `isExcluded` / `exclusionRuleId` / `exclusionReason`
   preenchidos. **Função pura, sem mutação** — retorna objetos novos.
4. CRUD das regras: criar, editar, ativar/desativar, excluir. Excluir uma regra
   **não** reinclui os lançamentos que ela já excluiu (a FK é
   `ON DELETE SET NULL`); o `exclusion_reason` permanece como registro histórico.
   Deixe isso explícito na UI.
5. **Seed sugerido, não automático.** Na primeira visita, se o perfil não tiver
   nenhuma regra, a UI oferece um botão "Criar regras sugeridas" que insere:

| Nome | `match_type` | `match_value` | `is_active` |
|---|---|---|---|
| Pagamento de fatura | `description_contains` | `INCLUSAO DE PAGAMENTO` | `true` |
| Pagamento via QR Code | `description_contains` | `PAGAMENTO FATURA QR CODE` | `true` |
| Estorno de tarifa | `description_contains` | `ESTORNO TARIFA` | `true` |
| Lançamentos negativos | `negative_amount` | `null` | **`false`** |

   O usuário confirma antes de qualquer insert — nada entra no banco dele sem
   clique.
6. A UI mostra, por regra, **quantos lançamentos ela já excluiu**
   (`count` em `card_entries` por `exclusion_rule_id`). É o que permite
   descobrir uma regra ampla demais.

### Schema / Tipos

```typescript
// src/utils/cards/exclusion-rules.ts

export interface ExclusionRule {
  id: string;
  name: string;
  match_type: "description_contains" | "category_equals" | "negative_amount";
  match_value: string | null;
  card_id: string | null;
  is_active: boolean;
}

export interface ExclusionMatch {
  ruleId: string;
  ruleName: string;
  reason: string;
}

export interface EvaluableEntry {
  description: string;
  categoryLabel: string | null;
  amount: number;
  cardId: string | null;
}

export function evaluateExclusion(
  entry: EvaluableEntry,
  rules: ExclusionRule[],
): ExclusionMatch | null;

export function applyExclusionRules<T extends EvaluableEntry>(
  entries: T[],
  rules: ExclusionRule[],
): Array<T & {
  isExcluded: boolean;
  exclusionRuleId: string | null;
  exclusionReason: string | null;
}>;
```

```typescript
// src/utils/validation/exclusion-rule-schema.ts
import { z } from "zod";

export const exclusionRuleSchema = z
  .object({
    name: z.string().trim().min(1, "Dê um nome à regra."),
    match_type: z.enum(["description_contains", "category_equals", "negative_amount"]),
    match_value: z.string().trim().nullable().optional(),
    card_id: z.string().uuid().nullable().optional(),
    is_active: z.boolean().default(true),
  })
  .refine(
    (r) => r.match_type === "negative_amount" || Boolean(r.match_value),
    { path: ["match_value"], message: "Informe o texto a procurar." },
  );
```

## Critérios de Aceitação
- [ ] CA-01: `evaluateExclusion` casa `"Inclusao de Pagamento    "` (com espaços)
      com a regra `INCLUSAO DE PAGAMENTO` — teste explícito para o espaço à direita.
- [ ] CA-02: `evaluateExclusion` **não** casa `"PAGAMENTO*CLINICA DE E"` com a
      regra `INCLUSAO DE PAGAMENTO` — teste explícito do falso positivo.
- [ ] CA-03: regra com `card_id` preenchido só afeta lançamentos daquele cartão.
- [ ] CA-04: regra `is_active = false` nunca casa.
- [ ] CA-05: `applyExclusionRules` não muta o array de entrada (teste comparando
      referências).
- [ ] CA-06: o botão "Criar regras sugeridas" só aparece quando o perfil tem
      zero regras, e insere exatamente as 4 da tabela — com a de negativos
      inativa.
- [ ] CA-07: cada regra na lista mostra a contagem de lançamentos que já excluiu.
- [ ] CA-08: `npm test`, `npm run typecheck` e `npm run build` passam.

## Comandos de Validação
```bash
npm test -- exclusion-rules exclusion-rule-schema
npm run typecheck && npm run build
npm run dev   # /cartoes?aba=cartoes — criar regras sugeridas, editar, desativar
```

## Notas de Implementação
- A regra `negative_amount` nasce **desativada** de propósito: dos 38 negativos
  reais, uns são pagamento de fatura (lixo) e outros são estorno de compra
  (informação legítima). Ligar por padrão esconderia dado de verdade.
- Ordem de avaliação = ordem da lista. Se duas regras casarem, vence a primeira.
  Não invente sistema de prioridade — se o usuário precisar, ele reordena
  desativando/recriando; complexidade extra aqui não se paga.
- Não hardcode as descrições da tabela de seed no código de avaliação. Elas são
  **dados** que o usuário confirma; o avaliador só sabe ler regras do banco.
