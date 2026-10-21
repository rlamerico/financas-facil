# [004] Cadastrar cartões e apelidos

## Objetivo
CRUD dos cartões de crédito, com apelidos (aliases) e agrupamento
Pessoal × Empresa, para que a importação e os relatórios saibam de qual
plástico é cada gasto.

## Contexto

O **Finanças Fácil** (Next.js 16 App Router + Supabase) está ganhando um módulo
de Faturas de Cartão de Crédito que substitui a planilha do usuário.

**O problema que esta spec resolve:** na planilha, o mesmo cartão físico aparece
com nomes diferentes a cada mês. O adicional da sogra do usuário aparece como
`RA-IEDA`, `RODRIGO AMERICO IEDA`, `RODRIGO AMERICO-IEDA`, `RPA IEDA`,
`Rodrigo C6 Ieda`, `UBER-IEDA` e `Uber Ieda` — 7 nomes, 1 cartão. É por isso que
a aba "Resumo Cartões" da planilha muda de linhas todo mês e os totais não
batem entre meses.

A chave estável é o **`Final do Cartão`** (4 dígitos). Nos dados reais são
**11 finais distintos** para **15 nomes**. O cadastro de cartões guarda o final
e uma lista de apelidos; a importação (spec 006) resolve o cartão pelo final e
registra o nome encontrado como apelido novo quando ainda não conhece.

O usuário separa os gastos em dois grupos, que aparecem na planilha como
"Compras Pessoais" e "RPA": os cartões pessoais (dele, da esposa, da sogra) e o
cartão da empresa (`RPA SOLUCOES`). Esse agrupamento é a coluna
`credit_cards.card_group` (`'pessoal'` | `'empresa'`).

### O que já existe

A migration `009_credit_cards.sql` (spec 001) já criou:

```sql
credit_cards (id, profile_id, name, last_four, issuer, holder_label,
              card_group, color, is_active, created_at, updated_at)
              UNIQUE (profile_id, last_four)

card_aliases (id, profile_id, card_id, alias, created_at)
              UNIQUE (profile_id, alias)
```

Ambas com RLS por `profile_id`, no mesmo padrão de `bank_accounts`.

A rota `/cartoes` e a aba **Cartões** existem (spec 003) renderizando um
`<EmptyState />` — esta spec substitui o conteúdo dessa aba.

### Convenções obrigatórias do projeto

- **Hooks de dados**: React Query em `src/hooks/use-*.ts`, com
  `createClient()` de `@/services/supabase/client`. Padrão exato em
  `src/hooks/use-bank-accounts.ts`: um `useQuery` de listagem + mutations
  `useCreate*` / `useUpdate*` / `useDelete*`, cada uma invalidando
  `["<recurso>", profileId]` no `onSuccess`.
- **Validação**: schema Zod em `src/utils/validation/<recurso>-schema.ts` +
  teste ao lado. Padrão em `bank-account-schema.ts`.
- **Componentes**: `src/components/<modulo>/<recurso>-view.tsx` (lista + estado),
  `<recurso>-form.tsx` (formulário), `<recurso>-row.tsx` (linha). Só
  `profileId: string` atravessa Server → Client.
- **Formatação**: `formatCurrency` / `formatDate` de `@/utils/format`.

## Stack
- **Linguagem**: TypeScript 5 (strict)
- **Framework**: Next.js 16 (App Router), React 19
- **Banco de dados**: Supabase (PostgreSQL + RLS)
- **Libs relevantes**: `@tanstack/react-query`, `zod`, `lucide-react`, `radix-ui`
- **Variáveis de ambiente necessárias**: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `001-modelar-schema-cartoes` — as tabelas `credit_cards` e `card_aliases`
      e os tipos em `src/types/database.ts`
- [ ] `003-criar-shell-modulo-cartoes` — a rota `/cartoes` e a aba "Cartões"

Pré-condição verificável: `Tables<"credit_cards">` existe em
`src/types/database.ts`. Se não existir, **pare** e avise que a spec 001 não rodou.

## O que implementar

### Arquivos a CRIAR
- `src/hooks/use-credit-cards.ts` — listagem + create/update/delete + aliases
- `src/utils/validation/credit-card-schema.ts` — schema Zod
- `src/utils/validation/credit-card-schema.test.ts`
- `src/components/cards/credit-cards-section.tsx` — conteúdo da aba "Cartões"
- `src/components/cards/credit-card-form.tsx` — formulário criar/editar
- `src/components/cards/credit-card-row.tsx` — linha do cartão com apelidos
- `src/utils/cards/card-matching.ts` — resolução cartão ↔ nome/final (pura)
- `src/utils/cards/card-matching.test.ts`

### Arquivos a MODIFICAR
- `src/components/cards/cards-view.tsx` — trocar o placeholder da aba "Cartões"
  por `<CreditCardsSection profileId={profileId} />`

### Lógica principal

1. `useCreditCards(profileId)` lista os cartões **com os apelidos embutidos**,
   numa única query:
   `.from("credit_cards").select("*, card_aliases(id, alias)").eq("profile_id", profileId).order("name")`.
2. Criar cartão: `name`, `last_four`, `issuer?`, `holder_label?`, `card_group`,
   `color?`. Ao criar, gravar automaticamente o `name` normalizado como primeiro
   apelido — é o que faz a importação reconhecer o cartão sem cadastro extra.
3. Editar cartão: mesmos campos; `is_active` alterna via toggle na linha
   (cartão inativo some dos filtros padrão mas mantém o histórico).
4. Excluir cartão: só permitido se **não houver** `card_statements` associadas.
   Verifique com `count` antes e mostre erro claro
   (`"Este cartão tem N faturas importadas. Desative-o em vez de excluir."`).
   Não confie apenas no `ON DELETE CASCADE` — ele apagaria o histórico inteiro
   em silêncio.
5. Apelidos: adicionar e remover na linha do cartão. Toda gravação passa por
   `normalizeCardName` (mesma normalização do parser da spec 002: maiúsculo,
   sem acento, `-`/`_` → espaço, espaços colapsados). Apelido duplicado no
   perfil viola a constraint `UNIQUE (profile_id, alias)` — trate o erro
   `23505` do Postgres com mensagem amigável, não com stack trace.
6. `resolveCardByEntry` (em `card-matching.ts`) é a função pura que a spec 006
   vai consumir:
   - casa por `last_four` primeiro (chave estável);
   - se não achar, casa por apelido normalizado;
   - devolve `{ card, matchedBy: "last_four" | "alias" } | null`.

### Schema / Tipos

```typescript
// src/utils/validation/credit-card-schema.ts
import { z } from "zod";

export const CARD_GROUPS = [
  { value: "pessoal", label: "Pessoal" },
  { value: "empresa", label: "Empresa" },
] as const;

export const creditCardSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do cartão."),
  last_four: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Informe os 4 últimos dígitos."),
  issuer: z.string().trim().min(1).nullable().optional(),
  holder_label: z.string().trim().min(1).nullable().optional(),
  card_group: z.enum(["pessoal", "empresa"]),
  color: z.string().trim().nullable().optional(),
});

export type CreditCardInput = z.infer<typeof creditCardSchema>;
```

```typescript
// src/utils/cards/card-matching.ts

export interface MatchableCard {
  id: string;
  name: string;
  last_four: string;
  aliases: string[];   // já normalizados
}

export type CardMatch =
  | { card: MatchableCard; matchedBy: "last_four" | "alias" }
  | null;

/** Normalização canônica de nome de cartão. MAIÚSCULO, sem acento, sem
 *  pontuação de separação, espaços colapsados. "Rodrigo C6 Ieda" e
 *  "RODRIGO-C6-IEDA" produzem a mesma saída. */
export function normalizeCardName(value: string): string;

export function resolveCardByEntry(
  cards: MatchableCard[],
  entry: { cardLastFour: string; cardNameNormalized: string },
): CardMatch;
```

### Queries / Mutations
- **Listar**: `credit_cards` + join `card_aliases`, filtrado por `profile_id`,
  ordenado por `name`.
- **Criar cartão**: insert em `credit_cards`, seguido de insert do apelido
  inicial em `card_aliases`. Se o segundo falhar, o cartão fica sem apelido —
  aceitável; a UI permite adicionar depois.
- **Excluir**: `SELECT count(*) FROM card_statements WHERE card_id = ...` antes
  do delete.
- **Apelidos**: insert/delete em `card_aliases` sempre com `profile_id` explícito.

## Critérios de Aceitação
- [ ] CA-01: é possível criar, editar e desativar um cartão pela aba "Cartões".
- [ ] CA-02: criar um cartão grava automaticamente o nome normalizado como
      apelido inicial.
- [ ] CA-03: é possível adicionar e remover apelidos; apelido repetido mostra
      mensagem amigável em vez de erro cru do Postgres.
- [ ] CA-04: excluir cartão com faturas importadas é bloqueado com mensagem
      explicando o motivo; sem faturas, a exclusão funciona.
- [ ] CA-05: `normalizeCardName` faz `"Rodrigo C6 Ieda"`, `"RODRIGO-C6-IEDA"` e
      `"  rodrigo  c6  ieda "` colapsarem na mesma string, com teste para os 7
      apelidos reais do cartão da Ieda.
- [ ] CA-06: `resolveCardByEntry` prioriza `last_four` sobre apelido, com teste
      cobrindo o caso de nome divergente e final correto.
- [ ] CA-07: `npm test`, `npm run typecheck` e `npm run build` passam.

## Comandos de Validação
```bash
npm test -- credit-card-schema card-matching
npm run typecheck && npm run build
npm run dev   # /cartoes?aba=cartoes — criar 2 cartões, adicionar apelidos
```

## Notas de Implementação
- Cadastre estes 11 finais reais como dados de teste manual: `4281`, `3783`,
  `3355`, `9940`, `9498`, `9388`, `3103`, `1953`, `2407`, `6160`, `3613`.
- `card_group` é `pessoal` | `empresa` porque é assim que o usuário fecha as
  contas hoje ("Compras Pessoais" × "RPA" na planilha). Não invente um terceiro
  grupo — se a necessidade aparecer, é migration nova.
- **Não** use `window.confirm` para exclusão neste módulo se houver um dialog
  Radix já disponível; se não houver, `window.confirm` segue o padrão atual de
  `bank-accounts-view.tsx` e é aceitável.
- `normalizeCardName` precisa ser **idêntica** à normalização usada pelo parser
  (spec 002, `src/utils/card-import/normalize.ts`). Se a função da spec 002 já
  existir, **importe-a** em vez de duplicar — divergência entre as duas quebra
  o casamento por apelido de um jeito difícil de achar.
