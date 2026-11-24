# [009] Analisar gastos no longo prazo

## Objetivo
Dar a visão que a planilha não dá: a evolução dos gastos ao longo dos meses,
com liberdade de escolher um cartão, somar vários, ou comparar grupos.

## Contexto

O **Finanças Fácil** (Next.js 16 App Router + Supabase) está ganhando um módulo
de Faturas de Cartão de Crédito que substitui a planilha do usuário.

**O que falta na planilha:** o "Resumo Cartões" é uma sequência de tabelas
dinâmicas soltas, uma por mês, algumas com ano no título e outras não. Não dá
para ver a linha do tempo de um cartão, nem comparar o cartão da empresa com os
pessoais, nem responder "quanto a Virgínia gastou de janeiro a agosto".

O usuário tem cartões de contextos diferentes — dele, da esposa, da sogra e da
empresa (`RPA SOLUCOES`) — e o pedido é explícito: **ver cada um isolado e
agrupar quando quiser**.

Dados reais para calibrar a tela: 13 meses de histórico (Agosto/2025 a
Agosto/2026), 11 cartões, totais mensais entre ~16 mil e ~35 mil reais.

### O que já existe

**View `card_monthly_summary`** (spec 001), com `security_invoker = true`:

```sql
profile_id, card_id, reference_year, reference_month,
total_amount, entries_count, excluded_count
```

Uma linha por cartão/mês, com `total_amount` já líquido das exclusões.
É a fonte desta tela inteira — 11 cartões × 13 meses = ~143 linhas, o que cabe
numa query só, sem paginação.

**Tabela `credit_cards`**: `name`, `card_group` (`'pessoal'|'empresa'`),
`holder_label`, `color`.

**Tabela `card_entries`**: necessária apenas para o recorte por **categoria**
(`category_label`), que a view não cobre.

A aba **Longo prazo** existe (spec 003) com `<EmptyState />`; esta spec
substitui o conteúdo.

### Convenções obrigatórias do projeto

- `recharts` já instalado; siga o estilo de
  `src/components/reports/reports-view.tsx`.
- `src/components/ui/stat-card.tsx` e `sparkline.tsx` existem — reuse.
- `src/utils/month-labels.ts` já traz rótulos de mês em pt-BR — reuse em vez de
  recriar array de meses.
- Só `profileId: string` atravessa Server → Client.

## Stack
- **Linguagem**: TypeScript 5 (strict)
- **Framework**: Next.js 16 (App Router), React 19
- **Banco de dados**: Supabase (view `card_monthly_summary`, `card_entries`)
- **Libs relevantes**: `@tanstack/react-query`, `recharts`
- **Variáveis de ambiente necessárias**: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `001-modelar-schema-cartoes` — a view `card_monthly_summary`
- [ ] `008-resumir-cartoes-mes` — reuso dos componentes de período e de linha
      de cartão, e do padrão de leitura da view

Pré-condição verificável: `src/hooks/use-card-summary.ts` existe. Se não
existir, **pare** e diga que a spec 008 não rodou.

## O que implementar

### Arquivos a CRIAR
- `src/hooks/use-card-series.ts` — série mensal por cartão, no intervalo escolhido
- `src/utils/cards/long-term-series.ts` — montagem da série e agregações (puro)
- `src/utils/cards/long-term-series.test.ts`
- `src/components/cards/long-term-section.tsx` — conteúdo da aba
- `src/components/cards/card-multi-select.tsx` — seleção de cartões
- `src/components/cards/long-term-chart.tsx` — gráfico
- `src/components/cards/long-term-table.tsx` — tabela cartão × mês

### Arquivos a MODIFICAR
- `src/components/cards/cards-view.tsx` — trocar o placeholder da aba
  "Longo prazo" por `<LongTermSection profileId={profileId} />`

### Lógica principal

1. **Controles**:
   - intervalo: últimos 6 / 12 / 24 meses, ou intervalo livre (mês/ano inicial
     e final). Padrão: últimos 12 meses com dado.
   - **seleção de cartões** (múltipla, com "todos", "só pessoais", "só empresa"
     como atalhos);
   - **modo de visualização**:
     - `separado` — uma série por cartão (padrão);
     - `agrupado` — uma série só, somando os cartões selecionados;
     - `por-grupo` — duas séries, Pessoal e Empresa;
   - tipo de gráfico: linha ou barras empilhadas;
   - recorte opcional por categoria (`category_label`).
2. **Preenchimento de buracos**: meses sem fatura de um cartão entram na série
   com `0`, para a linha do tempo não pular. Distinga visualmente
   "zero real" de "sem fatura importada" (a tabela marca com `—`, o gráfico usa
   `null` para não desenhar o ponto).
3. **Tabela cartão × mês** abaixo do gráfico, com total por linha (o cartão no
   período), total por coluna (o mês) e o total geral. Exportável em CSV
   reusando `src/utils/export.ts`.
4. **Indicadores** no topo: total do período, média mensal, mês de maior gasto,
   variação do último mês contra a média.
5. **Recorte por categoria**: quando ativo, a série passa a somar
   `card_entries.amount` (não excluídos) filtrados por `category_label`,
   agrupados por mês — a view não tem esse eixo. Deixe claro na UI que o
   recorte por categoria consulta os lançamentos.
6. Clicar num ponto/barra abre a aba Lançamentos filtrada por aquele cartão e
   mês.

### Schema / Tipos

```typescript
// src/utils/cards/long-term-series.ts

export interface PeriodKey {
  year: number;
  month: number;   // 1-12
}

export interface SeriesPoint {
  period: PeriodKey;
  label: string;          // "ago/25"
  value: number;
  hasStatement: boolean;  // false => "sem fatura importada", não "gastou zero"
}

export interface CardSeries {
  cardId: string;
  cardName: string;
  cardGroup: "pessoal" | "empresa";
  color: string | null;
  points: SeriesPoint[];
  total: number;
  average: number;
}

export type ViewMode = "separado" | "agrupado" | "por-grupo";

export interface LongTermResult {
  periods: PeriodKey[];
  series: CardSeries[];
  grandTotal: number;
  monthlyAverage: number;
  peak: { period: PeriodKey; value: number } | null;
}

/** Enumera os meses do intervalo, inclusive os sem dado. */
export function enumeratePeriods(from: PeriodKey, to: PeriodKey): PeriodKey[];

export function buildLongTermSeries(input: {
  rows: Array<{ cardId: string; year: number; month: number; total: number }>;
  cards: Array<{ id: string; name: string; card_group: "pessoal" | "empresa"; color: string | null }>;
  selectedCardIds: string[];
  periods: PeriodKey[];
  mode: ViewMode;
}): LongTermResult;
```

### Queries / Mutations
- **Série base**: `card_monthly_summary` filtrada por `profile_id`, cartões
  selecionados e intervalo. ~143 linhas no histórico completo — uma query só,
  sem paginação.
- **Recorte por categoria**: `card_entries` com join em `card_statements`,
  filtrado por `is_excluded = false` e `category_label`, agregado por mês.
  Se o volume incomodar, crie uma segunda view numa migration nova — **não**
  traga 2.700 linhas para o browser para somar no client.

## Critérios de Aceitação
- [ ] CA-01: dá para selecionar um único cartão e ver só a evolução dele.
- [ ] CA-02: dá para selecionar vários cartões e alternar entre `separado`
      (uma série por cartão) e `agrupado` (uma série somada).
- [ ] CA-03: o modo `por-grupo` mostra exatamente duas séries, Pessoal e Empresa.
- [ ] CA-04: meses sem fatura não quebram a série, e a tabela distingue
      "sem fatura" (`—`) de "zero".
- [ ] CA-05: a tabela cartão × mês fecha: soma das linhas = soma das colunas =
      total geral.
- [ ] CA-06: o total do período bate com a soma dos Resumos mensais (spec 008)
      dos mesmos meses e cartões.
- [ ] CA-07: exportar CSV gera a mesma tabela exibida.
- [ ] CA-08: `enumeratePeriods` tem teste cobrindo virada de ano
      (`{2025,11} → {2026,2}` = 4 períodos).
- [ ] CA-09: `npm test`, `npm run typecheck` e `npm run build` passam.

## Comandos de Validação
```bash
npm test -- long-term-series
npm run typecheck && npm run build
npm run dev   # /cartoes?aba=longo-prazo
```

Conferência do CA-06:

```sql
select reference_year, reference_month, sum(total_amount)
from card_monthly_summary
group by 1,2 order by 1,2;
```

## Notas de Implementação
- `enumeratePeriods` é a peça que mais dá bug em série temporal. Escreva o teste
  da virada de ano **antes** da implementação.
- Não confie na ordem que o banco devolve: ordene por `(year, month)` no util,
  não na query.
- Rótulo de mês vem de `src/utils/month-labels.ts`. Se o formato curto
  (`"ago/25"`) não existir lá, acrescente **naquele arquivo** — não crie um
  segundo mapa de meses no módulo de cartões.
- Um gráfico com 11 séries fica ilegível. Padrão: os 5 cartões de maior gasto no
  período pré-selecionados, com o resto disponível no seletor.
