# [007] Listar e ajustar lançamentos da fatura

## Objetivo
Dar ao usuário a mesma liberdade que ele tem na planilha: ver todos os
lançamentos da fatura, filtrar, e **ignorar** os que não devem entrar nas
contas — só que de forma reversível e sem apagar nada.

## Contexto

O **Finanças Fácil** (Next.js 16 App Router + Supabase) está ganhando um módulo
de Faturas de Cartão de Crédito que substitui a planilha do usuário.

**O comportamento que esta spec replica:** hoje, depois de colar a fatura na
planilha, o usuário **apaga manualmente** as linhas que não quer nas contas.
Aqui isso vira exclusão **soft** — o lançamento continua no banco com
`is_excluded = true`, some dos totais, e pode voltar com um clique. Nada de
`DELETE`: dado de fatura apagado não volta, e o histórico é o que dá valor à
visão de longo prazo (spec 009).

A exclusão automática por regra já acontece na importação (spec 005/006). Esta
spec é a camada **manual** por cima: o usuário sempre pode ignorar o que a
regra não pegou, e reincluir o que a regra pegou errado.

### O que já existe

**Tabela `card_entries`** (spec 001), com RLS por `profile_id`:

```
id, profile_id, statement_id, card_id, purchase_date, description,
category_label, category_id, amount, amount_usd, fx_rate,
installment_current, installment_total, raw_installment,
is_excluded, exclusion_reason, excluded_by ('manual'|'rule'), exclusion_rule_id,
fingerprint, created_at, updated_at
```

**View `card_monthly_summary`** (spec 001): já calcula
`total_amount` somando só os não-excluídos — os totais se ajustam sozinhos
quando esta tela muda `is_excluded`.

**Importação (spec 006)** já populou `card_statements` e `card_entries`.
A aba **Lançamentos** existe (spec 003) com um `<EmptyState />`; esta spec
substitui o conteúdo.

### Fatos do dado real que a tela precisa aguentar

- ~2.700 lançamentos no histórico completo; ~200 por fatura mensal.
- 36 rótulos de categoria vindos da operadora (`category_label`), incluindo
  `-` que o parser já converteu em `null`.
- Parcelas decodificadas: `installment_current`/`installment_total` (ex.: 6/10),
  com `raw_installment` guardando o valor original bagunçado pelo Excel.
- 38 lançamentos negativos (estornos e pagamentos de fatura).
- Duplicatas legítimas: 3 pedágios `VIASUL` idênticos no mesmo dia. A tela
  **não** pode tratá-las como erro nem agrupá-las.

### Convenções obrigatórias do projeto

- Listagem paginada com `useInfiniteQuery` do React Query — padrão exato em
  `src/hooks/use-transactions.ts` (page size 20, `getNextPageParam` comparando
  `lastPage.length === pageSize`).
- Só `profileId: string` atravessa Server → Client.
- `formatCurrency` / `formatDate` de `@/utils/format`; números com `tabular-nums`.
- Tokens de cor semânticos (`text-muted`, `text-error`, `bg-surface`,
  `border-border`), nunca hex solto.

## Stack
- **Linguagem**: TypeScript 5 (strict)
- **Framework**: Next.js 16 (App Router), React 19
- **Banco de dados**: Supabase (PostgreSQL + RLS)
- **Libs relevantes**: `@tanstack/react-query`, `lucide-react`, `radix-ui`
- **Variáveis de ambiente necessárias**: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `001-modelar-schema-cartoes` — `card_entries` e `card_statements`
- [ ] `006-importar-fatura` — sem dados importados não há o que listar

Pré-condição verificável: `Tables<"card_entries">` existe em
`src/types/database.ts`. Se não existir, **pare**.

## O que implementar

### Arquivos a CRIAR
- `src/hooks/use-card-entries.ts` — listagem paginada + filtros + mutations
- `src/hooks/use-card-statements.ts` — faturas disponíveis (para o seletor)
- `src/components/cards/entries-section.tsx` — conteúdo da aba "Lançamentos"
- `src/components/cards/entries-filters.tsx` — barra de filtros
- `src/components/cards/entry-row.tsx` — linha do lançamento
- `src/components/cards/entry-exclude-dialog.tsx` — ignorar com motivo
- `src/utils/cards/entries-summary.ts` — totais do conjunto filtrado (puro)
- `src/utils/cards/entries-summary.test.ts`

### Arquivos a MODIFICAR
- `src/components/cards/cards-view.tsx` — trocar o placeholder da aba
  "Lançamentos" por `<EntriesSection profileId={profileId} />`

### Lógica principal

1. **Filtros** (todos combináveis, refletidos na URL para serem linkáveis):
   - período (mês/ano de referência da fatura, ou "todas");
   - cartão (múltipla escolha);
   - grupo (`pessoal` / `empresa` / todos);
   - categoria (`category_label`);
   - busca por descrição (`ilike`);
   - status: **considerados** (padrão) / **ignorados** / **todos**;
   - faixa de valor (mín/máx) e "só negativos".
2. **Ordenação** por data, valor ou descrição, asc/desc. Padrão: data desc.
3. **Paginação** "carregar mais" com `useInfiniteQuery`, 50 por página.
4. **Cabeçalho de totais** — sempre visível, calculado **no banco**, não só na
   página carregada: quantidade, soma dos considerados, soma dos ignorados.
   Use uma query agregada separada (`select` com `count` + `sum`), porque somar
   apenas as páginas já baixadas mostraria número errado.
5. **Ignorar / reincluir**:
   - ignorar pede um motivo opcional e grava
     `is_excluded = true`, `excluded_by = 'manual'`, `exclusion_reason`,
     `exclusion_rule_id = null`;
   - reincluir zera os quatro campos;
   - a linha ignorada aparece esmaecida e riscada quando o filtro é "todos",
     com o motivo visível.
6. **Ações em lote**: selecionar várias linhas (checkbox + "selecionar todos os
   filtrados") e ignorar/reincluir de uma vez. Em lote grande, use
   `.in("id", ids)` em blocos de 200.
7. **Recategorizar**: editar `category_label` inline e, opcionalmente, vincular
   uma `category_id` do orçamento. O `category_label` original nunca é perdido
   em silêncio — se o usuário sobrescrever, avise que é o rótulo da operadora.
8. **Parcelas** aparecem como `6/10` a partir de
   `installment_current`/`installment_total`; quando ambos forem `null`, mostre
   `—` e exponha `raw_installment` num tooltip (é o valor bagunçado pelo Excel,
   útil para depurar).
9. **Realtime**: assine `postgres_changes` de `card_entries` filtrado por
   `profile_id` e invalide as queries — mesmo padrão de
   `use-transactions.ts`. É o que mantém a lista e o Resumo em sincronia quando
   uma importação roda em outra aba.
10. **Nunca** exponha `DELETE` de lançamento nesta tela. Excluir de verdade só
    faz sentido apagando a fatura inteira (ação da aba "Cartões e regras", com
    confirmação dupla) — e isso não é escopo desta spec.

### Schema / Tipos

```typescript
// src/hooks/use-card-entries.ts

export type CardEntry = Tables<"card_entries">;

export interface CardEntryFilters {
  referenceMonth?: number;
  referenceYear?: number;
  cardIds?: string[];
  cardGroup?: "pessoal" | "empresa";
  categoryLabel?: string;
  search?: string;
  status?: "considered" | "excluded" | "all";   // padrão: "considered"
  minAmount?: number;
  maxAmount?: number;
  onlyNegative?: boolean;
  sortBy?: "purchase_date" | "amount" | "description";
  sortDir?: "asc" | "desc";
}

export function useCardEntries(profileId: string, filters: CardEntryFilters, pageSize?: number);
export function useCardEntriesTotals(profileId: string, filters: CardEntryFilters);
export function useToggleEntryExclusion(profileId: string);
export function useBulkToggleEntryExclusion(profileId: string);
export function useUpdateEntryCategory(profileId: string);
```

```typescript
// src/utils/cards/entries-summary.ts

export interface EntriesSummary {
  count: number;
  consideredCount: number;
  excludedCount: number;
  consideredTotal: number;
  excludedTotal: number;
}

/** Totais de um conjunto de lançamentos já carregados. Usado nos testes e no
 *  agrupamento por categoria; o cabeçalho da tela usa a query agregada. */
export function summarizeEntries(entries: Array<Pick<CardEntry, "amount" | "is_excluded">>): EntriesSummary;
```

### Queries / Mutations
- **Listagem**: `card_entries` com `select("*, card_statements!inner(reference_month, reference_year), credit_cards!inner(name, card_group)")`,
  filtros aplicados via `eq`/`in`/`ilike`/`gte`/`lte`, `range()` para paginação.
- **Totais**: query agregada separada com os mesmos filtros.
- **Ignorar**: `update` em `card_entries` por `id` (ou `in` para lote).
- **Categoria**: `update` de `category_label` / `category_id`.

## Critérios de Aceitação
- [ ] CA-01: a lista mostra todos os lançamentos da fatura selecionada com
      data, cartão, descrição, categoria, parcela e valor.
- [ ] CA-02: ignorar um lançamento tira o valor do total imediatamente e a ação
      é reversível; nenhum registro é deletado do banco.
- [ ] CA-03: o cabeçalho de totais reflete **todos** os lançamentos filtrados,
      não só a página carregada — verificável filtrando algo com mais de 50
      itens e conferindo com o SQL.
- [ ] CA-04: filtros combinam entre si e sobrevivem ao refresh (estão na URL).
- [ ] CA-05: ação em lote ignora/reinclui múltiplos lançamentos numa operação.
- [ ] CA-06: lançamentos negativos aparecem com o sinal e em `text-error`.
- [ ] CA-07: as 3 linhas idênticas de `VIASUL` no mesmo dia aparecem como 3
      linhas distintas e selecionáveis individualmente.
- [ ] CA-08: parcela mostra `6/10` quando decodificada e `—` quando não.
- [ ] CA-09: `summarizeEntries` tem teste cobrindo excluídos e negativos.
- [ ] CA-10: `npm test`, `npm run typecheck` e `npm run build` passam.

## Comandos de Validação
```bash
npm test -- entries-summary
npm run typecheck && npm run build
npm run dev   # /cartoes?aba=lancamentos
```

Conferência do CA-03 no SQL Editor:

```sql
select count(*), sum(amount) filter (where not is_excluded) as considerado,
       sum(amount) filter (where is_excluded) as ignorado
from card_entries e
join card_statements s on s.id = e.statement_id
where s.reference_year = 2026 and s.reference_month = 8;
```

## Notas de Implementação
- Exclusão **soft** é o coração desta spec. Se em algum momento parecer mais
  fácil dar `DELETE`, lembre: é justamente o dado apagado da planilha que
  impede o usuário de auditar por que o total de um mês mudou.
- `excluded_by` distingue quem excluiu. Uma reimportação nunca deve sobrescrever
  uma exclusão `'manual'` — a spec 006 já garante isso não atualizando linhas
  existentes, mas não introduza aqui nenhum caminho que atropele isso.
- 200 linhas por fatura cabem numa tabela HTML comum. **Não** traga
  virtualização (`react-virtual` etc.) sem medir: é dependência nova para um
  problema que provavelmente não existe.
- Ao filtrar por `card_group`, o join com `credit_cards` precisa ser `!inner`,
  senão o PostgREST devolve linhas com o relacionamento nulo.
