# [001] Criar schema de empresas

## Objetivo
Criar a tabela `companies` (empresa MEI/Simples do usuário) com RLS, base de todo o módulo Empresas.

## Contexto
Finanças Fácil é uma plataforma Next.js + Supabase de finanças pessoais, em produção no MVP
(migrations 001–008 já existem em `supabase/migrations/`). Hoje tudo é amarrado a `profiles`
(`profiles.user_id` = `auth.users.id`). Não existe conceito de empresa. O módulo Empresas permite
que um usuário tenha 1+ empresas (MEI ou Simples Nacional), separadas das finanças pessoais.
Segurança vive no banco via RLS, nunca em middleware. Padrão de referência:
`supabase/migrations/006_bank_accounts.sql` (RLS com `auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)`
e `gen_random_uuid()` em vez de `uuid_generate_v4()`).

## Stack
- **Linguagem**: SQL (PostgreSQL)
- **Banco de dados**: Supabase/PostgreSQL com RLS
- **Variáveis de ambiente necessárias**: nenhuma para escrever o arquivo; `SUPABASE_ACCESS_TOKEN` (via direnv) só para aplicar

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- Nenhuma (primeira spec)

## O que implementar

### Arquivos a CRIAR
- `supabase/migrations/009_companies.sql` — tabela `companies` + RLS + índice

### Arquivos a MODIFICAR
- Nenhum

### Lógica principal
1. Confirmar o último número em `supabase/migrations/` (esperado 008); se já houver 009, usar o próximo livre e ajustar o nome.
2. Criar `companies` com `ENABLE ROW LEVEL SECURITY` no mesmo arquivo, antes de qualquer INSERT.
3. Criar 4 policies (SELECT/INSERT/UPDATE/DELETE) no padrão de `006_bank_accounts.sql`.
4. Criar índice em `profile_id`.
5. **NÃO aplicar a migration no banco.** Apenas escrever o arquivo. A aplicação exige aprovação explícita do usuário e
   conferência de `cat supabase/.temp/project-ref` (irreversível no ambiente errado).

### Schema / Tipos
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  cnpj TEXT NOT NULL CHECK (cnpj ~ '^[0-9]{14}$'),   -- somente dígitos
  regime TEXT NOT NULL CHECK (regime IN ('mei', 'simples', 'outro')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (profile_id, cnpj)
);
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
```

## Critérios de Aceitação
- [ ] CA-01: `009_companies.sql` existe, com `ENABLE ROW LEVEL SECURITY` e 4 policies baseadas em `auth.uid()`
- [ ] CA-02: `cnpj` só aceita 14 dígitos; `regime` só aceita `mei`/`simples`/`outro`
- [ ] CA-03: unicidade `(profile_id, cnpj)` e índice em `profile_id`
- [ ] CA-04: arquivo NÃO foi aplicado em nenhum banco (apenas versionado)

## Comandos de Validação
```bash
grep -c "ENABLE ROW LEVEL SECURITY" supabase/migrations/009_companies.sql   # >= 1
grep -c "CREATE POLICY" supabase/migrations/009_companies.sql               # = 4
```

## Notas de Implementação
> Branch: `feat/empresa-recebimentos`. Commit: `feat(business): add companies table with RLS`. Sem push.
> `regime` é TEXT+CHECK (padrão do projeto, sem enum). Limite anual do MEI, DAS e Fator R ficam fora (fase futura).
