# [002] Criar schema de clientes e recebimentos

## Objetivo
Criar as tabelas `business_clients` e `business_receipts` (com câmbio USD→BRL) com RLS isolada por empresa.

## Contexto
Módulo Empresas do Finanças Fácil (Next.js + Supabase). A tabela `companies` (spec 001, migration `009_companies.sql`)
já existe no repositório: `id`, `profile_id → profiles(id)`, `legal_name`, `trade_name`, `cnpj`, `regime`.
O dono é quem tem `auth.uid() = profiles.user_id` do `companies.profile_id`.
Caso de uso: o usuário tem clientes PJ do **Brasil (BRL)** e do **exterior (USD)** e precisa entregar à contabilidade,
por recebimento: data do recebimento, valor em USD e valor em BRL.
**Decisão de produto (cotação, opção c):** guardar o **BRL efetivamente recebido** (editável, é o que vale para o contador)
**e** a **PTAX do BCB** do dia como referência. Ambas as cotações ficam gravadas.
Padrão de RLS: `supabase/migrations/006_bank_accounts.sql`.

## Stack
- **Linguagem**: SQL (PostgreSQL) + TypeScript (tipos gerados)
- **Banco de dados**: Supabase/PostgreSQL com RLS
- **Variáveis de ambiente necessárias**: `SUPABASE_ACCESS_TOKEN` (direnv) apenas se for regenerar tipos via CLI

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `001-criar-schema-empresas` — tabela `companies` referenciada por FK

## O que implementar

### Arquivos a CRIAR
- `supabase/migrations/010_business_clients_receipts.sql`

### Arquivos a MODIFICAR
- `src/types/database.ts` — adicionar manualmente os tipos `Row/Insert/Update` das duas tabelas (e de `companies`, se ainda faltar)
  no mesmo formato das existentes (não aplicar migration só para gerar tipos; se o usuário já tiver aplicado, pode usar `generate_typescript_types`)

### Lógica principal
1. Criar `business_clients` e `business_receipts`, cada uma com `ENABLE ROW LEVEL SECURITY` no mesmo arquivo.
2. Policies (SELECT/INSERT/UPDATE/DELETE) por tabela, verificando propriedade via empresa:
   `EXISTS (SELECT 1 FROM companies c JOIN profiles p ON p.id = c.profile_id WHERE c.id = <tabela>.company_id AND p.user_id = auth.uid())`.
3. Em `business_receipts`, o `WITH CHECK` de INSERT/UPDATE também deve garantir que `client_id` pertence à mesma `company_id`.
4. Constraints de câmbio (ver schema).
5. Índices em `company_id`, `received_on` e `client_id`.
6. **NÃO aplicar no banco**; conferir `cat supabase/.temp/project-ref` e pedir aprovação antes de qualquer `db push`.

### Schema / Tipos
```sql
CREATE TABLE business_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  document TEXT,                                   -- CNPJ (BR) ou ID estrangeiro
  origin TEXT NOT NULL CHECK (origin IN ('domestic', 'foreign')),
  country TEXT,                                    -- ISO-3166 alpha-2, obrigatório se foreign
  default_currency TEXT NOT NULL CHECK (default_currency IN ('BRL', 'USD')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (origin <> 'foreign' OR country IS NOT NULL)
);

CREATE TABLE business_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES business_clients(id) ON DELETE RESTRICT NOT NULL,
  received_on DATE NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('BRL', 'USD')),
  amount_original NUMERIC(14,2) NOT NULL CHECK (amount_original > 0),
  exchange_rate NUMERIC(12,6),                     -- cotação efetiva aplicada (USD→BRL)
  ptax_rate NUMERIC(12,6),                         -- PTAX BCB do dia (referência)
  amount_brl NUMERIC(14,2) NOT NULL CHECK (amount_brl > 0),  -- BRL efetivo (editável)
  invoice_ref TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('expected', 'received')),
  notes TEXT,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (currency <> 'USD' OR (exchange_rate IS NOT NULL AND exchange_rate > 0)),
  CHECK (currency <> 'BRL' OR (exchange_rate IS NULL AND amount_brl = amount_original))
);
```

## Critérios de Aceitação
- [ ] CA-01: migration `010` cria as 2 tabelas com RLS habilitada e 4 policies cada, todas via propriedade da empresa
- [ ] CA-02: USD sem `exchange_rate` é rejeitado; BRL com `amount_brl <> amount_original` é rejeitado
- [ ] CA-03: cliente `foreign` sem `country` é rejeitado
- [ ] CA-04: recebimento não pode apontar para cliente de outra empresa
- [ ] CA-05: `src/types/database.ts` tipa as novas tabelas; `npm run typecheck` passa
- [ ] CA-06: migration NÃO foi aplicada sem aprovação

## Comandos de Validação
```bash
grep -c "ENABLE ROW LEVEL SECURITY" supabase/migrations/010_business_clients_receipts.sql   # = 2
grep -c "CREATE POLICY" supabase/migrations/010_business_clients_receipts.sql               # = 8
npm run typecheck
```

## Notas de Implementação
> Commit: `feat(business): add clients and receipts tables with RLS`. Após aplicar (com aprovação), rodar `get_advisors` (security)
> e testar RLS com 2 usuários distintos. `ptax_rate` é nullable (API do BCB pode falhar). `ON DELETE RESTRICT` em client_id preserva histórico contábil.
