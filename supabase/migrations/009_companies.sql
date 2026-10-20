-- Módulo Empresas (Fase 1): empresa MEI ou Simples Nacional do usuário.
-- Tabela-base do módulo; clientes e recebimentos (migration 010) referenciam esta.
--
-- Mesmo padrão de RLS de `006_bank_accounts.sql`: o dono é quem tem `auth.uid()`
-- batendo com `profiles.user_id` do `profile_id` da empresa.
-- `gen_random_uuid()` (nativo, sem extensão) em vez de `uuid_generate_v4()`.
-- `regime` é TEXT + CHECK (sem enum), mesmo padrão de `transactions.status`.
-- Limite anual do MEI, DAS e Fator R ficam para fase futura.

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  cnpj TEXT NOT NULL CHECK (cnpj ~ '^[0-9]{14}$'),
  regime TEXT NOT NULL CHECK (regime IN ('mei', 'simples', 'outro')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (profile_id, cnpj)
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own companies" ON companies
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can insert own companies" ON companies
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can update own companies" ON companies
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can delete own companies" ON companies
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE INDEX idx_companies_profile_id ON companies(profile_id);
