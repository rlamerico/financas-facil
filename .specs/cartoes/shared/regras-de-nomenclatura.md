# Regras de nomenclatura e convenções

Válido para todo o módulo de Faturas de Cartão de Crédito. Estas regras vêm do
código que já existe — siga-as em vez de inventar um dialeto novo.

## Arquivos e pastas

| Tipo | Local | Padrão | Exemplo |
|---|---|---|---|
| Página (Server Component) | `src/app/(app)/<rota>/page.tsx` | rota em português | `src/app/(app)/cartoes/page.tsx` |
| Componente | `src/components/<modulo>/<nome>.tsx` | kebab-case | `src/components/cards/summary-section.tsx` |
| Hook de dados | `src/hooks/use-<recurso>.ts` | `use-` + kebab-case | `src/hooks/use-card-entries.ts` |
| Util puro | `src/utils/<area>/<nome>.ts` | kebab-case | `src/utils/cards/monthly-summary.ts` |
| Schema Zod | `src/utils/validation/<recurso>-schema.ts` | sufixo `-schema` | `src/utils/validation/credit-card-schema.ts` |
| Teste | ao lado do arquivo | `<nome>.test.ts` | `src/utils/cards/monthly-summary.test.ts` |
| Migration | `supabase/migrations/NNN_<snake_case>.sql` | 3 dígitos | `supabase/migrations/009_credit_cards.sql` |

A pasta do módulo é `src/components/cards/` (inglês, como `bank-accounts`,
`budgets`, `investments`), enquanto a **rota** é `/cartoes` (português, como
`/contas`, `/planejamento`). Essa mistura é proposital e já é o padrão do repo:
código em inglês, superfície do usuário em português.

## Código

- **Identificadores em inglês**: variáveis, funções, tipos, colunas.
- **Texto de UI em português-BR**: rótulos, mensagens de erro, placeholders.
- **Comentários em português** quando explicam uma decisão; e comentário só
  existe para explicar **por quê**, nunca o que o código já diz.
- `camelCase` para variáveis e funções; `PascalCase` para tipos e componentes;
  `UPPER_SNAKE_CASE` para constantes.
- Booleanos com prefixo `is`, `has`, `should` ou `can`.
- `const` por padrão. Nada de mutação de estado: transforme criando objetos novos.
- Funções com responsabilidade única, abaixo de ~50 linhas.
- Arquivos entre 200 e 400 linhas; acima de 800, quebre.
- Sem `console.log` no código commitado.

## Banco de dados

- Tabelas no plural, `snake_case`: `credit_cards`, `card_entries`.
- Chave estrangeira: `<singular>_id` — `card_id`, `statement_id`, `profile_id`.
- Booleano: `is_*` / `has_*` — `is_excluded`, `is_active`.
- Dinheiro: `DECIMAL(12,2)`. Nunca `float`.
- Timestamps: `created_at` / `updated_at` como `TIMESTAMP WITH TIME ZONE`.
- **Toda** tabela: `profile_id` + `ENABLE ROW LEVEL SECURITY` + 4 políticas
  (select/insert/update/delete) no padrão de `bank_accounts` (migration 006):

```sql
auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
```

## Fronteira Server → Client (regra de ouro do repo)

A página é um Server Component **fino**: resolve `profiles.id` e passa **só a
string `profileId`** para o Client Component. Nada de objeto de sessão, client
Supabase ou dado já carregado atravessando a fronteira.

## React Query

- Chave: `["<recurso>", profileId, ...filtros]` — ex.: `["card-entries", profileId, filters]`.
- Listagens paginadas com `useInfiniteQuery` (padrão em `use-transactions.ts`).
- Mutations invalidam `["<recurso>", profileId]` no `onSuccess`.
- Realtime via `postgres_changes` filtrado por `profile_id`, invalidando a query.

## UI

- Tailwind v4 com **tokens semânticos** de `globals.css`: `bg-surface`,
  `border-border`, `text-muted`, `text-error`, `shadow-card`. Nada de hex solto.
- Valores monetários sempre com `formatCurrency` de `@/utils/format` e classe
  `tabular-nums`.
- Datas com `formatDate` / `formatDateTime` do mesmo módulo.
- Ícones de `lucide-react`; primitivos de `radix-ui`; gráficos com `recharts`.
- Reuse `src/components/ui/`: `button`, `card`, `stat-card`, `sparkline`.

## Chaves do módulo de cartões

| Conceito | Chave | Observação |
|---|---|---|
| Cartão | `credit_cards.last_four` | única chave estável na planilha |
| Apelido | `card_aliases.alias` | sempre normalizado (MAIÚSCULO, sem acento) |
| Fatura | `(card_id, reference_year, reference_month)` | uma fatura = cartão × mês |
| Lançamento | `(statement_id, fingerprint)` | garante idempotência da reimportação |

## Testes

- `vitest`, arquivo ao lado do código.
- Estrutura AAA (Arrange / Act / Assert).
- Nome do teste descreve o comportamento:
  `test("decodifica parcela corrompida pelo Excel em 6/10", ...)`.
- Toda função pura do módulo tem teste. Caso de erro também, não só o caminho feliz.
