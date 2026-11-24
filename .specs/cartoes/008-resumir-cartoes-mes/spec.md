# [008] Resumir cartões do mês

## Objetivo
Reproduzir — e melhorar — a aba "Resumo Cartões" da planilha: quanto cada
cartão gastou no mês escolhido, com os subtotais Pessoal × Empresa e a variação
contra o mês anterior.

## Contexto

O **Finanças Fácil** (Next.js 16 App Router + Supabase) está ganhando um módulo
de Faturas de Cartão de Crédito que substitui a planilha do usuário.

**A tela que esta spec entrega é a que o usuário mais olha.** Na planilha, a aba
"Resumo Cartões" é uma sequência de tabelas dinâmicas, uma por mês, cada uma
com `Nome no Cartão` × `SUM de Valor (em R$)` e uma linha "Total geral" —
mais dois subtotais escritos à mão embaixo: **"Compras Pessoais"** e **"RPA"**
(a empresa).

Exemplo real, mês de Novembro:

```
COMPRAS CASA               1.521,08
PAULA TAMARA               4.442,92
PAULA TAMARA IEDA            364,94
RODRIGO AMERICO            5.187,65
RODRIGO AMERICO IEDA         538,69
RPA SOLUCOES               8.327,15
RPA SOLUCOES IEDA            348,88
VIRGINIA FERREIRA          3.596,99
Total geral               26.274,65
```

**Os três problemas da planilha que esta tela resolve:**
1. As linhas mudam de mês para mês, porque o nome do cartão varia — o mesmo
   plástico aparece como `RA-IEDA` num mês e `RODRIGO AMERICO IEDA` no outro.
   Aqui o agrupamento é por **cartão cadastrado**, então as linhas são estáveis.
2. Os subtotais Pessoal/RPA são digitados à mão e desatualizam. Aqui saem de
   `credit_cards.card_group`.
3. Não há comparação com o mês anterior. Aqui tem.

### O que já existe

**View `card_monthly_summary`** (spec 001), com `security_invoker = true`:

```sql
profile_id, card_id, reference_year, reference_month,
total_amount,      -- soma dos lançamentos NÃO excluídos
entries_count, excluded_count
```

`total_amount` já respeita as exclusões (regra e manuais) — não recalcule isso
no client.

**Tabela `credit_cards`** com `name`, `last_four`, `card_group`
(`'pessoal'|'empresa'`), `holder_label`, `color`, `is_active`.

A aba **Resumo** existe (spec 003) com `<EmptyState />`; esta spec substitui o
conteúdo. É a aba padrão do módulo.

### Convenções obrigatórias do projeto

- Cartões de resumo: existe `src/components/ui/stat-card.tsx` e
  `src/components/ui/sparkline.tsx` — **reuse**, não recrie.
- Gráficos: `recharts` já está instalado e é usado em
  `src/components/reports/reports-view.tsx`. Siga o mesmo estilo.
- `formatCurrency` de `@/utils/format`; números com `tabular-nums`.
- Só `profileId: string` atravessa Server → Client.

## Stack
- **Linguagem**: TypeScript 5 (strict)
- **Framework**: Next.js 16 (App Router), React 19
- **Banco de dados**: Supabase (view `card_monthly_summary` + `credit_cards`)
- **Libs relevantes**: `@tanstack/react-query`, `recharts`, `lucide-react`
- **Variáveis de ambiente necessárias**: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `001-modelar-schema-cartoes` — a view `card_monthly_summary`
- [ ] `007-listar-lancamentos-fatura` — o Resumo linka para os lançamentos
      filtrados de cada cartão

Pré-condição verificável: a view `card_monthly_summary` responde
(`select * from card_monthly_summary limit 1`). Se não existir, **pare**.

## O que implementar

### Arquivos a CRIAR
- `src/hooks/use-card-summary.ts` — leitura da view + cartões, por período
- `src/utils/cards/monthly-summary.ts` — montagem das linhas e subtotais (puro)
- `src/utils/cards/monthly-summary.test.ts`
- `src/components/cards/summary-section.tsx` — conteúdo da aba "Resumo"
- `src/components/cards/summary-period-picker.tsx` — seletor mês/ano
- `src/components/cards/summary-card-row.tsx` — linha de cartão
- `src/components/cards/summary-group-totals.tsx` — Pessoal × Empresa × Total

### Arquivos a MODIFICAR
- `src/components/cards/cards-view.tsx` — trocar o placeholder da aba "Resumo"
  por `<SummarySection profileId={profileId} />`

### Lógica principal

1. Seletor de período (mês/ano). Padrão: o mês mais recente **que tem fatura
   importada**, não o mês corrente — o usuário importa a fatura com atraso, e
   abrir num mês vazio parece bug.
2. Busca em uma query os registros de `card_monthly_summary` do mês escolhido
   **e do mês anterior** (para a variação), com join em `credit_cards`.
3. `buildMonthlySummary` monta:
   - uma linha por cartão **com lançamentos no mês**, ordenada por valor desc;
   - cartão cadastrado sem fatura no mês aparece com `0,00` e marcação
     "sem fatura importada" — é assim que se descobre uma fatura esquecida;
   - `variation` absoluta e percentual contra o mês anterior (`null` quando não
     havia dado no mês anterior — **não** mostre "+100%" nesse caso);
   - subtotais por `card_group` e total geral.
4. Cabeçalho com `StatCard`s: **Total do mês**, **Pessoal**, **Empresa**, e
   **variação vs. mês anterior**.
5. Gráfico de barras horizontais (recharts) com o valor por cartão, usando
   `credit_cards.color` quando houver.
6. Cada linha linka para a aba Lançamentos já filtrada por aquele cartão e
   período (`/cartoes?aba=lancamentos&cartao=<id>&mes=<m>&ano=<a>`).
7. Cada linha mostra também `excluded_count` ("3 ignorados"), com link para os
   ignorados daquele cartão — transparência sobre o que saiu da conta.
8. Estado vazio: se não há nenhuma fatura importada, o `EmptyState` chama a
   ação "Importar fatura" (spec 006).

### Schema / Tipos

```typescript
// src/utils/cards/monthly-summary.ts

export interface SummaryInputRow {
  cardId: string;
  cardName: string;
  cardGroup: "pessoal" | "empresa";
  color: string | null;
  isActive: boolean;
  totalAmount: number;
  entriesCount: number;
  excludedCount: number;
}

export interface SummaryRow extends SummaryInputRow {
  previousTotal: number | null;
  variationAbsolute: number | null;   // null quando não há mês anterior
  variationPercent: number | null;    // null quando previousTotal é 0 ou null
  hasStatement: boolean;
  shareOfTotal: number;               // 0..1
}

export interface MonthlySummary {
  rows: SummaryRow[];
  personalTotal: number;
  businessTotal: number;
  grandTotal: number;
  previousGrandTotal: number | null;
  grandVariationPercent: number | null;
}

export function buildMonthlySummary(input: {
  current: SummaryInputRow[];
  previous: SummaryInputRow[];
  allCards: Array<{ id: string; name: string; card_group: "pessoal" | "empresa"; color: string | null; is_active: boolean }>;
}): MonthlySummary;
```

### Queries / Mutations
```typescript
// Uma query cobrindo os dois meses (mês atual + anterior), com o cartão junto.
supabase
  .from("card_monthly_summary")
  .select("*, credit_cards!inner(id, name, card_group, color, is_active)")
  .eq("profile_id", profileId)
  .or(`and(reference_year.eq.${y},reference_month.eq.${m}),and(reference_year.eq.${py},reference_month.eq.${pm})`);
```
Se o `or` aninhado der trabalho no PostgREST, faça **duas** queries simples em
paralelo — clareza vale mais que uma ida a menos ao banco.

## Critérios de Aceitação
- [ ] CA-01: o Resumo lista um cartão por linha com o total do mês, e o total
      geral bate com a soma das linhas.
- [ ] CA-02: os subtotais Pessoal e Empresa saem de `card_group` e somam o total
      geral.
- [ ] CA-03: o período abre no mês mais recente com fatura importada.
- [ ] CA-04: os totais **ignoram** os lançamentos excluídos — verificável
      excluindo um lançamento na aba Lançamentos e vendo o Resumo cair.
- [ ] CA-05: a variação vs. mês anterior aparece por cartão e no total; quando
      não há mês anterior, mostra `—`, nunca `+100%`.
- [ ] CA-06: cartão cadastrado sem fatura no mês aparece com `0,00` e a marcação
      "sem fatura importada".
- [ ] CA-07: clicar numa linha abre a aba Lançamentos já filtrada por aquele
      cartão e período.
- [ ] CA-08: `buildMonthlySummary` tem testes cobrindo mês sem anterior,
      `previousTotal = 0` (sem divisão por zero) e cartão sem fatura.
- [ ] CA-09: os números batem com a aba "Resumo Cartões" da planilha para um
      mês conferido à mão (ex.: Novembro, total 26.274,65).
- [ ] CA-10: `npm test`, `npm run typecheck` e `npm run build` passam.

## Comandos de Validação
```bash
npm test -- monthly-summary
npm run typecheck && npm run build
npm run dev   # /cartoes?aba=resumo
```

Conferência contra a planilha:

```sql
select c.name, sum(e.amount) filter (where not e.is_excluded) as total
from card_entries e
join card_statements s on s.id = e.statement_id
join credit_cards c on c.id = e.card_id
where s.reference_year = 2025 and s.reference_month = 11
group by 1 order by 2 desc;
```

## Notas de Implementação
- **Não** recalcule totais no client somando `card_entries`. A view
  `card_monthly_summary` existe exatamente para isso e já aplica o filtro de
  exclusão; duas fontes de verdade para o mesmo número é como se cria a
  divergência que o usuário não consegue explicar.
- Divisão por zero na variação percentual: quando `previousTotal` é `0` ou
  `null`, `variationPercent` é `null`. Trate no util, não no JSX.
- Os totais da planilha incluem lançamentos que o usuário **já tinha apagado à
  mão**. Se o número não bater exatamente na conferência do CA-09, verifique
  primeiro as exclusões automáticas (spec 005) antes de suspeitar do cálculo.
- Cartão inativo com fatura no mês continua aparecendo. Inativo esconde da
  seleção padrão de filtros, não do histórico.
