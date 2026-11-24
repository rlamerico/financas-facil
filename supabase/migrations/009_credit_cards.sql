-- Módulo de Faturas de Cartão de Crédito (spec 001).
--
-- O módulo é ISOLADO do fluxo de caixa: os lançamentos de fatura vivem em
-- `card_entries` e não entram em `transactions` — evita contagem dupla no
-- Dashboard e no Planejado × Realizado. A integração opcional é assunto da
-- spec 011.
--
-- A categoria que vem da operadora é guardada como texto cru em
-- `card_entries.category_label`; `category_id` é um mapeamento OPCIONAL para
-- as categorias do orçamento, para que a taxonomia da bandeira não polua o
-- planejamento do usuário.
--
-- Usa `gen_random_uuid()` (nativo do Postgres 13+) e NÃO `uuid_generate_v4()`:
-- a extensão `uuid-ossp` da migration 001 não está no `search_path` do projeto
-- remoto (erro real encontrado ao aplicar a migration 006).

-- Um registro por plástico físico. `last_four` é a única chave estável vinda
-- da fatura — o nome impresso varia entre as abas para o mesmo cartão.
CREATE TABLE credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  last_four TEXT NOT NULL,
  issuer TEXT,
  holder_label TEXT,
  card_group TEXT NOT NULL DEFAULT 'pessoal'
    CHECK (card_group IN ('pessoal', 'empresa')),
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (profile_id, last_four)
);

-- Vários nomes ("RA-IEDA", "RODRIGO AMERICO IEDA", "UBER-IEDA", ...) apontando
-- para o mesmo cartão. `alias` chega sempre normalizado pela camada de import:
-- MAIÚSCULO, sem acento, espaços colapsados.
CREATE TABLE card_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE NOT NULL,
  alias TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (profile_id, alias)
);

-- Criada ANTES de `card_entries` porque há FK de entries para rules.
-- `card_id` NULL significa "vale para todos os cartões do perfil".
CREATE TABLE card_exclusion_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  match_type TEXT NOT NULL
    CHECK (match_type IN ('description_contains', 'category_equals', 'negative_amount')),
  match_value TEXT,
  card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Uma fatura = um cartão × um mês de referência.
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

-- `amount` guarda negativos de propósito (estornos, "Inclusao de Pagamento"):
-- são dados legítimos da fatura. Quem decide ignorá-los é a regra de exclusão
-- (spec 005), não o schema.
-- `fingerprint` é o hash de dedupe calculado no import; único por fatura, é o
-- que torna a reimportação do mesmo arquivo idempotente (spec 006).
CREATE TABLE card_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  statement_id UUID REFERENCES card_statements(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE NOT NULL,
  purchase_date DATE NOT NULL,
  description TEXT NOT NULL,
  category_label TEXT,
  category_id UUID REFERENCES categories(id),
  amount DECIMAL(12,2) NOT NULL,
  amount_usd DECIMAL(12,2),
  fx_rate DECIMAL(12,4),
  installment_current SMALLINT,
  installment_total SMALLINT,
  raw_installment TEXT,
  is_excluded BOOLEAN NOT NULL DEFAULT false,
  exclusion_reason TEXT,
  excluded_by TEXT CHECK (excluded_by IN ('manual', 'rule')),
  exclusion_rule_id UUID REFERENCES card_exclusion_rules(id) ON DELETE SET NULL,
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (statement_id, fingerprint)
);

-- RLS habilitada nas 5 tabelas ANTES de qualquer INSERT, no mesmo padrão de
-- `bank_accounts` (migration 006): dono é quem tem `auth.uid()` batendo com
-- `profiles.user_id` do `profile_id` da linha.
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit cards" ON credit_cards
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can insert own credit cards" ON credit_cards
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can update own credit cards" ON credit_cards
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can delete own credit cards" ON credit_cards
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

ALTER TABLE card_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own card aliases" ON card_aliases
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can insert own card aliases" ON card_aliases
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can update own card aliases" ON card_aliases
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can delete own card aliases" ON card_aliases
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

ALTER TABLE card_exclusion_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own card exclusion rules" ON card_exclusion_rules
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can insert own card exclusion rules" ON card_exclusion_rules
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can update own card exclusion rules" ON card_exclusion_rules
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can delete own card exclusion rules" ON card_exclusion_rules
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

ALTER TABLE card_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own card statements" ON card_statements
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can insert own card statements" ON card_statements
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can update own card statements" ON card_statements
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can delete own card statements" ON card_statements
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

ALTER TABLE card_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own card entries" ON card_entries
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can insert own card entries" ON card_entries
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can update own card entries" ON card_entries
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can delete own card entries" ON card_entries
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
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
