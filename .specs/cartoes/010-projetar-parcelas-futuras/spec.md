# [010] Projetar parcelas futuras

> **Fase 3 — melhoria.** Não faz parte do MVP 1. Só execute depois que
> 001–009 estiverem funcionando com dados reais importados.

## Objetivo
Mostrar quanto das próximas faturas **já está comprometido** por compras
parceladas que ainda não terminaram de cair.

## Contexto

O **Finanças Fácil** (Next.js 16 App Router + Supabase) tem um módulo de
Faturas de Cartão de Crédito que substitui a planilha do usuário.

**A oportunidade:** o parser (spec 002) decodifica a coluna `Parcela` da fatura
em `installment_current` / `installment_total`. Quando a fatura de agosto traz
"COMPRA DE PONTOS LATAM — parcela 6 de 10", **já se sabe** que setembro,
outubro, novembro e dezembro terão essa mesma parcela. A planilha não faz isso;
o usuário só descobre o comprometimento quando a fatura chega.

Nos dados reais, 861 lançamentos vêm com parcelamento decodificado e há
parcelamentos de até 14 vezes.

**A regra de negócio:** para cada lançamento **não excluído** com
`installment_total > installment_current`, projete
`installment_total − installment_current` parcelas futuras, uma por mês
subsequente ao mês de referência da fatura, com o mesmo valor.

**Limites que precisam estar visíveis na tela** (projeção honesta é projeção que
declara o que não sabe):
- só cobre parcelamentos **já iniciados** — compra parcelada feita ontem só
  aparece quando a fatura dela for importada;
- não cobre assinaturas e recorrências (`Única` mensal repetida) — são gasto
  recorrente, não parcela;
- juros e variação cambial de compras internacionais não são projetados;
- a projeção **não** considera parcelas de faturas que o usuário ainda não
  importou.

## Stack
- **Linguagem**: TypeScript 5 (strict)
- **Framework**: Next.js 16 (App Router), React 19
- **Banco de dados**: Supabase (`card_entries` + `card_statements`)
- **Libs relevantes**: `@tanstack/react-query`, `recharts`
- **Variáveis de ambiente necessárias**: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `001-modelar-schema-cartoes` — `card_entries` com as colunas de parcela
- [ ] `007-listar-lancamentos-fatura` — a projeção linka para os lançamentos
- [ ] `009-analisar-longo-prazo` — reuso de `enumeratePeriods` e do estilo de
      gráfico

Pré-condição verificável: `src/utils/cards/long-term-series.ts` exporta
`enumeratePeriods`. Se não existir, **pare**.

## O que implementar

### Arquivos a CRIAR
- `src/utils/cards/future-installments.ts` — projeção (pura)
- `src/utils/cards/future-installments.test.ts`
- `src/hooks/use-future-installments.ts` — busca os parcelamentos abertos
- `src/components/cards/future-installments-panel.tsx` — painel da projeção

### Arquivos a MODIFICAR
- `src/components/cards/long-term-section.tsx` — acrescentar o painel de
  projeção abaixo da série histórica, com separação visual clara entre
  **realizado** e **projetado**

### Lógica principal

1. Busca os lançamentos abertos: `is_excluded = false`,
   `installment_current IS NOT NULL`, `installment_total IS NOT NULL`,
   `installment_total > installment_current`, e apenas da **fatura mais recente
   de cada cartão** — senão a mesma compra parcelada, presente em várias
   faturas, é projetada várias vezes.
2. `projectFutureInstallments` gera, por lançamento, uma parcela por mês futuro
   até fechar `installment_total`, mantendo o valor.
3. Agrega por mês e por cartão: quanto cada cartão já tem comprometido em cada
   mês futuro.
4. A UI mostra:
   - `StatCard`s: total comprometido, quantos meses à frente, maior mês;
   - gráfico de barras dos próximos 12 meses, **hachurado ou em opacidade
     reduzida** para não se confundir com realizado;
   - tabela expansível por mês, listando as compras que compõem o valor, com
     link para o lançamento de origem.
5. Estado vazio: "Nenhuma compra parcelada em aberto" quando não houver.

### Schema / Tipos

```typescript
// src/utils/cards/future-installments.ts

export interface OpenInstallment {
  entryId: string;
  cardId: string;
  cardName: string;
  description: string;
  amount: number;
  installmentCurrent: number;
  installmentTotal: number;
  referenceYear: number;    // mês de referência da fatura onde ela apareceu
  referenceMonth: number;
}

export interface ProjectedInstallment {
  entryId: string;
  cardId: string;
  cardName: string;
  description: string;
  amount: number;
  installmentNumber: number;   // 7, 8, 9...
  installmentTotal: number;
  year: number;
  month: number;
}

export interface FutureProjection {
  byMonth: Array<{
    year: number;
    month: number;
    label: string;
    total: number;
    byCard: Array<{ cardId: string; cardName: string; total: number }>;
    items: ProjectedInstallment[];
  }>;
  grandTotal: number;
  monthsAhead: number;
  peak: { year: number; month: number; total: number } | null;
}

export function projectFutureInstallments(
  open: OpenInstallment[],
  horizonMonths?: number,   // padrão 12
): FutureProjection;
```

### Queries / Mutations
```sql
-- Última fatura importada de cada cartão (evita projeção duplicada)
with latest as (
  select distinct on (card_id) id, card_id, reference_year, reference_month
  from card_statements
  where profile_id = :profile
  order by card_id, reference_year desc, reference_month desc
)
select e.*, l.reference_year, l.reference_month
from card_entries e
join latest l on l.id = e.statement_id
where not e.is_excluded
  and e.installment_total > e.installment_current;
```
Faça isso como uma **view** numa migration nova (`010_open_installments.sql`,
`security_invoker = true`) ou como duas queries no client — o `distinct on` não
existe no PostgREST.

## Critérios de Aceitação
- [ ] CA-01: uma compra "6 de 10" na fatura de agosto/2026 projeta exatamente 4
      parcelas: set, out, nov e dez/2026.
- [ ] CA-02: compra "10 de 10" não projeta nada.
- [ ] CA-03: lançamento excluído não entra na projeção.
- [ ] CA-04: a mesma compra parcelada presente em várias faturas importadas é
      projetada **uma vez só** (a partir da fatura mais recente).
- [ ] CA-05: a projeção respeita a virada de ano (parcela 11/14 em dez/2026
      projeta jan, fev e mar/2027).
- [ ] CA-06: a UI separa visualmente realizado de projetado e declara os
      limites da projeção em texto.
- [ ] CA-07: `projectFutureInstallments` tem teste para cada CA acima.
- [ ] CA-08: `npm test`, `npm run typecheck` e `npm run build` passam.

## Comandos de Validação
```bash
npm test -- future-installments
npm run typecheck && npm run build
npm run dev   # /cartoes?aba=longo-prazo — painel "Já comprometido"
```

## Notas de Implementação
- A projeção é **estimativa**, e a tela precisa dizer isso. Número projetado
  apresentado como fato é como se perde a confiança do usuário no módulo inteiro.
- O horizonte padrão é 12 meses. Parcelamento de 14× existe nos dados, então
  deixe o horizonte configurável, mas não passe de 24 — além disso a projeção
  vira ficção.
- Nada de gravar as parcelas projetadas no banco. Elas são cálculo derivado; ao
  materializar você cria a obrigação de invalidá-las a cada importação.
