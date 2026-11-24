# [001] Modelar schema de cartões de crédito

## Objetivo
Criar as tabelas, políticas RLS e tipos TypeScript que sustentam todo o módulo de
Faturas de Cartão de Crédito — cartões, apelidos, faturas mensais, lançamentos e
regras de exclusão.

## Contexto

O produto é o **Finanças Fácil**, uma plataforma de gestão financeira 360°
(Next.js 16 App Router + Supabase). Hoje ele controla `transactions`, `budgets`,
`categories`, `investments`, `bank_accounts` e `profiles`.

O usuário controla as faturas dos cartões de crédito da família e da empresa
numa planilha (`files/Faturas Cartão de Crédito.xlsx`) com uma aba por mês de
fatura e uma aba "Resumo Cartões" que soma o gasto de cada cartão no mês. Este
módulo substitui essa planilha.

**Decisão de arquitetura (já tomada, não reabrir):** o módulo de cartões é
**isolado** do fluxo de caixa. Os lançamentos de fatura vivem em tabelas
próprias (`card_entries`) e **não** entram em `transactions` — nada de contagem
dupla no Dashboard nem no Planejado × Realizado. Uma spec futura (011) trata da
integração opcional; ela está fora do MVP.

**Decisão de arquitetura (já tomada):** a categoria que vem da operadora do
cartão (36 rótulos como "Supermercados / Mercearia / Padarias / Lojas de
Conveniência", "T&E Companhia aérea") é guardada como **texto cru** em
`card_entries.category_label`. Existe um `category_id` opcional para quem quiser
mapear para as categorias do orçamento, mas o módulo funciona 100% sem ele — a
taxonomia da bandeira não polui as categorias de planejamento do usuário.

**Fato crítico do domínio:** o campo `Final do Cartão` (4 últimos dígitos) é a
**única chave estável** do cartão. O `Nome no Cartão` varia entre as abas para o
mesmo plástico — o cartão adicional da Ieda aparece como `RA-IEDA`,
`RODRIGO AMERICO IEDA`, `RODRIGO AMERICO-IEDA`, `RPA IEDA`, `Rodrigo C6 Ieda`,
`UBER-IEDA` e `Uber Ieda`. Daí a tabela `card_aliases`: vários nomes apontando
para um cartão.

## Stack
- **Linguagem**: TypeScript 5 / SQL (PostgreSQL 15+)
- **Framework**: Next.js 16 (App Router)
- **Banco de dados**: Supabase (PostgreSQL + RLS)
- **Libs relevantes**: nenhuma nova — apenas SQL e o gerador de tipos do Supabase
- **Variáveis de ambiente necessárias**: `SUPABASE_ACCESS_TOKEN` (via `direnv`,
  ver `~/.claude/SUPABASE.md`); `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` já existem em `.env.local`

## Dependências
> Nenhuma. Esta é a spec de fundação do módulo.
- Pré-condição verificável: as migrations `001` a `008` já existem em
  `supabase/migrations/`. Se `008_sheet_sync.sql` não existir, **pare** e avise.

## O que implementar

### Arquivos a CRIAR
- `supabase/migrations/009_credit_cards.sql` — todas as tabelas, índices, view
  e políticas RLS do módulo

### Arquivos a MODIFICAR
- `src/types/database.ts` — regenerar com os tipos das novas tabelas
  (`npx supabase gen types typescript --linked > src/types/database.ts`).
  Se a CLI não estiver autenticada, edite o arquivo à mão seguindo o padrão
  exato das tabelas existentes (`Row` / `Insert` / `Update` / `Relationships`).

### Lógica principal

1. Criar `credit_cards` — um registro por plástico físico.
2. Criar `card_aliases` — os nomes que a fatura usa para aquele cartão.
3. Criar `card_exclusion_rules` **antes** de `card_entries` (há FK de entries
   para rules).
4. Criar `card_statements` — uma fatura = um cartão + um mês de referência.
5. Criar `card_entries` — os lançamentos.
6. Criar a view `card_monthly_summary` com `security_invoker = true`.
7. Habilitar RLS em **todas** as tabelas na mesma migration, antes de qualquer
   INSERT, com as 4 políticas (select/insert/update/delete) no mesmo padrão de
   `bank_accounts` (migration 006).

### Schema / Tipos

```sql
-- Use gen_random_uuid() (nativo), NÃO uuid_generate_v4(): a extensão
-- uuid-ossp da migration 001 não está no search_path do projeto remoto.
-- Isso já causou erro real na migration 006.

CREATE TABLE credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,                 -- nome canônico exibido: "Rodrigo Américo"
  last_four TEXT NOT NULL,            -- "3783" — chave estável vinda da fatura
  issuer TEXT,                        -- "C6", "Itaú", ...
  holder_label TEXT,                  -- "Rodrigo", "Ieda", "Paula", "Virgínia"
  card_group TEXT NOT NULL DEFAULT 'pessoal'
    CHECK (card_group IN ('pessoal', 'empresa')),
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (profile_id, last_four)
);

CREATE TABLE card_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE NOT NULL,
  alias TEXT NOT NULL,   -- normalizado: MAIÚSCULO, sem acento, espaços colapsados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (profile_id, alias)
);

CREATE TABLE card_exclusion_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  match_type TEXT NOT NULL
    CHECK (match_type IN ('description_contains', 'category_equals', 'negative_amount')),
  match_value TEXT,      -- NULL quando match_type = 'negative_amount'
  card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE,  -- NULL = todos
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE card_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE NOT NULL,
  reference_month INTEGER NOT NULL CHECK (reference_month BETWEEN 1 AND 12),
  reference_year INTEGER NOT NULL,
  source_file_name TEXT,
  source_sheet_name TEXT,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (profile_id, card_id, reference_year, reference_month)
);

CREATE TABLE card_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  statement_id UUID REFERENCES card_statements(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE NOT NULL,
  purchase_date DATE NOT NULL,
  description TEXT NOT NULL,
  category_label TEXT,                 -- texto cru da operadora
  category_id UUID REFERENCES categories(id),  -- mapeamento OPCIONAL
  amount DECIMAL(12,2) NOT NULL,       -- BRL; negativo = estorno/pagamento
  amount_usd DECIMAL(12,2),
  fx_rate DECIMAL(12,4),
  installment_current SMALLINT,
  installment_total SMALLINT,
  raw_installment TEXT,                -- valor original: "Única", "46082", "1/14"
  is_excluded BOOLEAN NOT NULL DEFAULT false,
  exclusion_reason TEXT,
  excluded_by TEXT CHECK (excluded_by IN ('manual', 'rule')),
  exclusion_rule_id UUID REFERENCES card_exclusion_rules(id) ON DELETE SET NULL,
  fingerprint TEXT NOT NULL,           -- hash de dedupe (calculado no import)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (statement_id, fingerprint)
);

-- Totais por cartão/mês. É uma VIEW, não colunas materializadas: o total muda
-- toda vez que o usuário exclui/reinclui um lançamento, e manter isso em
-- trigger é fonte garantida de divergência.
-- security_invoker = true faz a view respeitar a RLS das tabelas-base.
CREATE VIEW card_monthly_summary WITH (security_invoker = true) AS
SELECT
  e.profile_id,
  e.card_id,
  s.reference_year,
  s.reference_month,
  COALESCE(SUM(e.amount) FILTER (WHERE NOT e.is_excluded), 0) AS total_amount,
  COUNT(*) AS entries_count,
  COUNT(*) FILTER (WHERE e.is_excluded) AS excluded_count
FROM card_entries e
JOIN card_statements s ON s.id = e.statement_id
GROUP BY e.profile_id, e.card_id, s.reference_year, s.reference_month;

CREATE INDEX idx_credit_cards_profile_id ON credit_cards(profile_id);
CREATE INDEX idx_card_aliases_profile_id ON card_aliases(profile_id);
CREATE INDEX idx_card_statements_profile_id ON card_statements(profile_id);
CREATE INDEX idx_card_statements_card_period
  ON card_statements(card_id, reference_year, reference_month);
CREATE INDEX idx_card_entries_statement_id ON card_entries(statement_id);
CREATE INDEX idx_card_entries_card_id ON card_entries(card_id);
CREATE INDEX idx_card_entries_purchase_date ON card_entries(purchase_date);
CREATE INDEX idx_card_entries_profile_id ON card_entries(profile_id);
CREATE INDEX idx_card_exclusion_rules_profile_id ON card_exclusion_rules(profile_id);
```

### RLS (obrigatório — mesmo padrão da migration 006)

Para **cada** uma das 5 tabelas:

```sql
ALTER TABLE <tabela> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own <tabela>" ON <tabela>
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );
-- idem para INSERT (WITH CHECK), UPDATE (USING) e DELETE (USING)
```

## Critérios de Aceitação
- [ ] CA-01: `supabase/migrations/009_credit_cards.sql` existe e cria as 5
      tabelas + 1 view + índices.
- [ ] CA-02: as 5 tabelas têm `ENABLE ROW LEVEL SECURITY` **na mesma migration**,
      com as 4 políticas cada (select/insert/update/delete).
- [ ] CA-03: a migration usa `gen_random_uuid()` e **não** `uuid_generate_v4()`.
- [ ] CA-04: a view `card_monthly_summary` é criada com `security_invoker = true`.
- [ ] CA-05: `src/types/database.ts` expõe `Tables<"credit_cards">`,
      `Tables<"card_aliases">`, `Tables<"card_statements">`,
      `Tables<"card_entries">` e `Tables<"card_exclusion_rules">`.
- [ ] CA-06: `npm run typecheck` passa.

## Comandos de Validação
```bash
# 1. Conferir em QUAL projeto Supabase você está antes de qualquer push
cat supabase/.temp/project-ref     # esperado: fvbugayxfmkjfbfwvheb

# 2. Aplicar a migration
npx supabase db push

# 3. Regenerar tipos
npx supabase gen types typescript --linked > src/types/database.ts

# 4. Verificar RLS de todas as tabelas do módulo
#    (rodar no SQL Editor do Supabase — todas devem vir com rowsecurity = true)
#    SELECT tablename, rowsecurity FROM pg_tables
#    WHERE schemaname='public' AND tablename LIKE 'card%' OR tablename='credit_cards';

npm run typecheck
```

## Notas de Implementação
- `UNIQUE (profile_id, last_four)` assume que dois cartões do mesmo perfil não
  compartilham os 4 últimos dígitos. Nos dados reais são 11 finais distintos,
  todos únicos. Se um dia colidir, o caminho é acrescentar `issuer` à constraint
  numa migration nova — não vale complicar agora.
- `card_entries.amount` guarda **negativos** de propósito: 38 linhas da planilha
  são `Inclusao de Pagamento`, `Estorno Tarifa` e estornos de compra. Elas são
  dados legítimos da fatura; quem decide ignorá-las é a regra de exclusão
  (spec 005), não o schema.
- `installment_current` / `installment_total` são `SMALLINT` **nullable**: nem
  toda linha é parcelada e nem todo valor da planilha é recuperável.
- `fingerprint` é `NOT NULL` e único por fatura — é o que torna a reimportação
  do mesmo arquivo idempotente (spec 006).
