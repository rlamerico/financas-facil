# [006] Importar fatura (upload manual)

## Objetivo
Permitir que o usuário arraste o `.xlsx` da fatura, revise o que será importado
e confirme — gravando faturas e lançamentos de forma idempotente, sem nunca
duplicar nem perder o que ele já ajustou à mão.

## Contexto

O **Finanças Fácil** (Next.js 16 App Router + Supabase) está ganhando um módulo
de Faturas de Cartão de Crédito que substitui a planilha
`files/Faturas Cartão de Crédito.xlsx` do usuário.

Esta é a spec que **junta** as peças anteriores: o parser (002), o cadastro de
cartões (004) e as regras de exclusão (005). Ela entrega a experiência de
importação: **upload → prévia revisável → confirmação → gravação**.

**Decisão de escopo (MVP 1):** a importação é **manual**. O usuário faz upload
do arquivo. A automação via Google Drive é a spec 012 e está fora do MVP.

### O que já existe

**Tabelas (spec 001)** — todas com RLS por `profile_id`:

```sql
credit_cards (id, profile_id, name, last_four, issuer, holder_label,
              card_group, color, is_active)  UNIQUE (profile_id, last_four)
card_aliases (id, profile_id, card_id, alias)  UNIQUE (profile_id, alias)
card_statements (id, profile_id, card_id, reference_month, reference_year,
                 source_file_name, source_sheet_name, imported_at)
                 UNIQUE (profile_id, card_id, reference_year, reference_month)
card_entries (id, profile_id, statement_id, card_id, purchase_date, description,
              category_label, category_id, amount, amount_usd, fx_rate,
              installment_current, installment_total, raw_installment,
              is_excluded, exclusion_reason, excluded_by, exclusion_rule_id,
              fingerprint)  UNIQUE (statement_id, fingerprint)
card_exclusion_rules (id, profile_id, name, match_type, match_value, card_id, is_active)
```

**Parser (spec 002)** — `src/utils/card-import/parse-statement.ts`:
`parseWorkbook(buffer, fileName): ParsedWorkbook`, com
`entries: ParsedEntry[]`, `rejectedRows`, `skippedSheets`. Cada `ParsedEntry`
traz `sheetName`, `referenceMonth`, `referenceYear` (**pode ser `null`**),
`purchaseDate`, `cardNameRaw`, `cardNameNormalized`, `cardLastFour`,
`categoryLabel`, `description`, `amount`, `amountUsd`, `fxRate`,
`installmentCurrent`, `installmentTotal`, `rawInstallment` e `fingerprint`.

**Casamento de cartão (spec 004)** — `src/utils/cards/card-matching.ts`:
`resolveCardByEntry(cards, entry)`, que casa por `last_four` primeiro e por
apelido depois.

**Regras de exclusão (spec 005)** — `src/utils/cards/exclusion-rules.ts`:
`applyExclusionRules(entries, rules)`, pura.

**UI (spec 003)** — a rota `/cartoes` com abas; esta spec acrescenta a ação
"Importar fatura", disponível a partir de qualquer aba.

### Fatos do arquivo real que a UI precisa tratar

- 13 abas de fatura + a aba `Resumo Cartões` (o parser já descarta esta).
- 5 abas (`Agosto`…`Dezembro`) **não têm ano no nome** — o parser devolve
  `referenceYear: null` e a UI **precisa perguntar**. Chutar ano é como se cria
  fatura duplicada no ano errado.
- Uma mesma aba contém lançamentos de **vários cartões** (até 8 finais
  distintos). Uma aba não é uma fatura: **uma fatura = aba × cartão**.
- 15 nomes de cartão para 11 finais reais — nomes desconhecidos são normais e
  não podem travar a importação.
- 13 linhas caem em `rejectedRows` (1 sem data, 10 sem valor, 2 com valor
  ambíguo) e 9 são linhas de total do rodapé (`ignoredTotalRows`). Todas
  precisam ser mostradas, não engolidas.

## Stack
- **Linguagem**: TypeScript 5 (strict)
- **Framework**: Next.js 16 (App Router), React 19
- **Banco de dados**: Supabase (PostgreSQL + RLS) — escrita pelo client
  autenticado (`@/services/supabase/client`), protegida por RLS. **Não** use
  `service_role` aqui: é upload do próprio usuário, RLS é a proteção correta.
- **Libs relevantes**: `xlsx` (já instalada), `@tanstack/react-query`, `zod`
- **Variáveis de ambiente necessárias**: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `001-modelar-schema-cartoes` — as 5 tabelas
- [ ] `002-parsear-planilha-fatura` — `parseWorkbook` e `ParsedEntry`
- [ ] `004-cadastrar-cartoes` — `resolveCardByEntry` e o CRUD de cartões
- [ ] `005-configurar-regras-exclusao` — `applyExclusionRules`

Pré-condição verificável: os arquivos `src/utils/card-import/parse-statement.ts`,
`src/utils/cards/card-matching.ts` e `src/utils/cards/exclusion-rules.ts`
existem. Se algum faltar, **pare** e diga qual spec não rodou.

## O que implementar

### Arquivos a CRIAR
- `src/utils/cards/import-plan.ts` — monta o plano de importação (puro)
- `src/utils/cards/import-plan.test.ts`
- `src/hooks/use-card-import.ts` — mutation que grava o plano confirmado
- `src/components/cards/import-dialog.tsx` — o fluxo em 3 passos
- `src/components/cards/import-dropzone.tsx` — seleção/arraste do arquivo
- `src/components/cards/import-preview.tsx` — tabela de prévia por fatura
- `src/components/cards/import-card-resolver.tsx` — resolver cartões desconhecidos
- `src/components/cards/import-result.tsx` — resumo pós-gravação

### Arquivos a MODIFICAR
- `src/components/cards/cards-view.tsx` — botão "Importar fatura" no cabeçalho
  do módulo, abrindo o `ImportDialog`

### Lógica principal

**Passo 1 — Arquivo**
1. O usuário arrasta ou seleciona um `.xlsx`/`.xls`. Rejeite outras extensões e
   arquivos acima de 20 MB com mensagem clara (o arquivo real tem 228 KB).
2. Lê como `ArrayBuffer` e chama `parseWorkbook`. Erro de leitura vira mensagem
   ("Não foi possível ler a planilha"), não tela branca.

**Passo 2 — Revisão** (`buildImportPlan`, função pura)
3. Agrupa `entries` por `(sheetName, cardLastFour)` — cada grupo é uma
   **fatura candidata** (`PlannedStatement`).
4. Para cada grupo, resolve o cartão com `resolveCardByEntry`. Resultado:
   - `matched` — cartão conhecido;
   - `unknown` — nenhum cartão bate: o usuário escolhe entre **criar um cartão
     novo** (pré-preenchido com nome e final vindos da planilha) ou **vincular a
     um cartão existente** (o que grava um apelido novo).
5. Abas sem ano no nome exigem que o usuário informe o ano antes de continuar.
   O campo vem pré-preenchido com uma sugestão baseada nas datas de compra do
   grupo, mas **marcado como pendente** até o usuário confirmar.
6. Detecta faturas que **já existem** no banco (mesmo `card_id` + mês + ano) e
   mostra: "Fatura já importada — serão adicionados apenas os lançamentos novos".
7. Aplica `applyExclusionRules` e mostra, por fatura: total de lançamentos,
   quantos serão ignorados por regra, valor total e valor considerado.
8. Mostra as `rejectedRows` e as `skippedSheets` num bloco "Não importado", com
   o motivo de cada uma.
9. O usuário pode **desmarcar faturas inteiras** antes de confirmar.

**Passo 3 — Gravação** (`useCardImport`)
10. Para cada fatura marcada, na ordem:
    a. Cria os cartões novos pendentes (e seus apelidos).
    b. `upsert` em `card_statements` com `onConflict: "profile_id,card_id,reference_year,reference_month"`,
       devolvendo o `id`.
    c. **Lê as `fingerprint` já existentes** daquela `statement_id`.
    d. Insere **apenas** os lançamentos cuja fingerprint ainda não existe,
       em lotes de 500 (`insert`, não `upsert`).
11. **Regra de ouro da reimportação:** lançamentos já existentes **nunca** são
    atualizados. É isso que preserva as exclusões manuais e as
    recategorizações que o usuário fez na spec 007. Reimportar o mesmo arquivo
    deve resultar em "0 lançamentos novos".
12. Ao final, invalida as queries `["card-statements", profileId]`,
    `["card-entries", profileId]`, `["card-summary", profileId]` e
    `["credit-cards", profileId]`.
13. Mostra o resumo: por fatura, quantos inseridos, quantos já existiam,
    quantos ignorados por regra.
14. Falha no meio: reporte **o que já foi gravado** e o que faltou. Não tente
    rollback manual — as faturas são independentes entre si e a idempotência
    torna o retry seguro.

### Schema / Tipos

```typescript
// src/utils/cards/import-plan.ts

export type CardResolution =
  | { kind: "matched"; cardId: string; cardName: string; matchedBy: "last_four" | "alias" }
  | { kind: "create"; name: string; lastFour: string; cardGroup: "pessoal" | "empresa" }
  | { kind: "link"; cardId: string; aliasToCreate: string }
  | { kind: "unresolved" };

export interface PlannedEntry extends ParsedEntry {
  isExcluded: boolean;
  exclusionRuleId: string | null;
  exclusionReason: string | null;
}

export interface PlannedStatement {
  key: string;                    // `${sheetName}::${cardLastFour}`
  sheetName: string;
  cardLastFour: string;
  cardNameRaw: string;
  referenceMonth: number;
  referenceYear: number | null;   // null => o usuário precisa informar
  suggestedYear: number | null;   // derivado das datas de compra do grupo
  resolution: CardResolution;
  existingStatementId: string | null;
  entries: PlannedEntry[];
  totalAmount: number;            // soma de tudo
  consideredAmount: number;       // soma dos não ignorados
  excludedCount: number;
  selected: boolean;
}

export interface ImportPlan {
  fileName: string;
  statements: PlannedStatement[];
  rejectedRows: RejectedRow[];
  skippedSheets: SkippedSheet[];
}

export function buildImportPlan(input: {
  parsed: ParsedWorkbook;
  cards: MatchableCard[];
  rules: ExclusionRule[];
  existingStatements: Array<{ id: string; card_id: string; reference_month: number; reference_year: number }>;
}): ImportPlan;

/** Sugestão de ano para aba sem ano: o ano mais frequente entre as datas de
 *  compra do grupo, acrescido de 1 quando o mês de referência é menor que o
 *  mês da compra mais recente (compra em dezembro cai na fatura de janeiro).
 *  É SUGESTÃO — a UI exige confirmação. */
export function suggestReferenceYear(entries: ParsedEntry[], referenceMonth: number): number | null;
```

### Queries / Mutations
- **Ler cartões**: `credit_cards` + `card_aliases` do perfil (reusar `useCreditCards`).
- **Ler regras**: `card_exclusion_rules` ativas do perfil.
- **Ler faturas existentes**: `card_statements` do perfil (`id, card_id, reference_month, reference_year`).
- **Gravar**: insert em `credit_cards`/`card_aliases` (quando houver criação),
  `upsert` em `card_statements`, `select` de fingerprints, `insert` em lotes em
  `card_entries`.

## Critérios de Aceitação
- [ ] CA-01: importar `files/Faturas Cartão de Crédito.xlsx` gera um plano com
      uma fatura por par (aba × final de cartão), nunca uma fatura por aba.
- [ ] CA-02: abas sem ano no nome (`Agosto`…`Dezembro`) bloqueiam a confirmação
      até o usuário informar o ano; a sugestão aparece pré-preenchida.
- [ ] CA-03: cartão desconhecido não trava a importação — o usuário cria ou
      vincula, e vincular grava o apelido novo em `card_aliases`.
- [ ] CA-04: a prévia mostra, por fatura, total de lançamentos, quantos serão
      ignorados por regra, valor total e valor considerado.
- [ ] CA-05: `rejectedRows` (13 no arquivo real), `ignoredTotalRows` (9) e
      `skippedSheets` aparecem num bloco "Não importado" com o motivo de cada.
- [ ] CA-06: **importar o mesmo arquivo duas vezes resulta em 0 lançamentos
      novos na segunda vez** — teste manual obrigatório.
- [ ] CA-07: uma exclusão manual feita depois da importação **sobrevive** a uma
      reimportação do mesmo arquivo.
- [ ] CA-08: as 31 duplicatas legítimas do arquivo real (3× `VIASUL` no mesmo
      dia e valor) são importadas como lançamentos distintos, não colapsadas.
- [ ] CA-09: `buildImportPlan` e `suggestReferenceYear` têm testes unitários.
- [ ] CA-10: `npm test`, `npm run typecheck` e `npm run build` passam.

## Comandos de Validação
```bash
npm test -- import-plan
npm run typecheck && npm run build
npm run dev
# 1. /cartoes -> "Importar fatura" -> arrastar files/Faturas Cartão de Crédito.xlsx
# 2. Resolver os cartões e os anos, confirmar
# 3. Repetir o MESMO arquivo: o resultado deve dizer 0 lançamentos novos
```

Conferência no SQL Editor do Supabase depois da primeira importação:

```sql
-- Deve bater com a aba "Resumo Cartões" do mês correspondente
select c.name, s.reference_month, s.reference_year,
       sum(e.amount) filter (where not e.is_excluded) as total
from card_entries e
join card_statements s on s.id = e.statement_id
join credit_cards c on c.id = e.card_id
group by 1,2,3 order by 3,2,1;
```

## Notas de Implementação
- Faça o parse **no browser**. O arquivo é pequeno (228 KB), a lib `xlsx` roda
  no client, e assim o servidor nunca recebe o arquivo bruto. Menos superfície,
  menos código.
- Insira em lotes de 500. O arquivo real tem 2.692 lançamentos válidos; um
  único `insert` gigante estoura limite de payload do PostgREST.
- **Não** apague e recrie os lançamentos de uma fatura na reimportação. Parece
  mais simples e destrói exatamente o trabalho manual que o usuário faz hoje na
  planilha — que é o problema que este módulo veio resolver.
- Se `referenceYear` continuar `null` na hora de gravar, é bug de fluxo: falhe
  ruidosamente com mensagem clara em vez de gravar um ano chutado.
- A prévia é o produto aqui. O usuário confia no módulo se ele mostra
  exatamente o que vai entrar **antes** de entrar.
