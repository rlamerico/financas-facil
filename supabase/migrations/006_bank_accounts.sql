-- Fase 6 (Painel n8n + Contas Bancárias) precisa de uma tabela de contas
-- bancárias que não existe no schema original (gap encontrado ao ler o PRD
-- e o schema real antes de implementar, mesmo tipo de gap que as Fases 3/4
-- encontraram em categories/budgets/investments).
--
-- CRUD simples de contas/saldos — sem conciliação bancária automática (isso
-- depende de integração real via n8n/Open Finance, fora do escopo do MVP).
-- `account_type` é TEXT livre (sem enum rígido), mesmo padrão de
-- `investments.asset_type`.
--
-- Usa `gen_random_uuid()` (nativo do Postgres 13+, sem depender de extensão)
-- em vez de `uuid_generate_v4()` (extensão `uuid-ossp`) — a extensão da
-- migration 001 não está no `search_path` do projeto remoto (erro real
-- encontrado ao aplicar: `function uuid_generate_v4() does not exist`),
-- então a função nativa é mais simples e não depende de investigar/corrigir
-- o schema da extensão numa fase que não é sobre isso.

CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  bank_name TEXT,
  account_type TEXT,
  balance DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Mesmo padrão de RLS de `transactions`/`investments`: dono é quem tem
-- `auth.uid()` batendo com `profiles.user_id` do `profile_id` da conta.
CREATE POLICY "Users can view own bank accounts" ON bank_accounts
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can insert own bank accounts" ON bank_accounts
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can update own bank accounts" ON bank_accounts
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can delete own bank accounts" ON bank_accounts
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE INDEX idx_bank_accounts_profile_id ON bank_accounts(profile_id);
