-- Módulo Empresas (Fase 1): clientes PJ (Brasil/Exterior) e recebimentos com câmbio.
-- Depende de `010_companies.sql`. Padrão de RLS de `006_bank_accounts.sql`, mas a
-- propriedade é verificada via empresa (companies -> profiles -> auth.uid()).
--
-- Cotação (decisão de produto, opção c): `amount_brl` é o BRL efetivamente recebido
-- (editável, é o valor que vai para a contabilidade); `exchange_rate` é a cotação
-- efetiva derivada; `ptax_rate` é a PTAX do BCB do dia, guardada só como referência.
-- `ON DELETE RESTRICT` em `client_id` preserva o histórico contábil.

CREATE TABLE business_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  document TEXT,
  origin TEXT NOT NULL CHECK (origin IN ('domestic', 'foreign')),
  country TEXT,
  default_currency TEXT NOT NULL CHECK (default_currency IN ('BRL', 'USD')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (origin <> 'foreign' OR country IS NOT NULL)
);

ALTER TABLE business_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business clients" ON business_clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies c
      JOIN profiles p ON p.id = c.profile_id
      WHERE c.id = business_clients.company_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own business clients" ON business_clients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies c
      JOIN profiles p ON p.id = c.profile_id
      WHERE c.id = business_clients.company_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own business clients" ON business_clients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM companies c
      JOIN profiles p ON p.id = c.profile_id
      WHERE c.id = business_clients.company_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own business clients" ON business_clients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM companies c
      JOIN profiles p ON p.id = c.profile_id
      WHERE c.id = business_clients.company_id AND p.user_id = auth.uid()
    )
  );

CREATE INDEX idx_business_clients_company_id ON business_clients(company_id);

CREATE TABLE business_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES business_clients(id) ON DELETE RESTRICT NOT NULL,
  received_on DATE NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('BRL', 'USD')),
  amount_original NUMERIC(14,2) NOT NULL CHECK (amount_original > 0),
  exchange_rate NUMERIC(12,6),
  ptax_rate NUMERIC(12,6),
  amount_brl NUMERIC(14,2) NOT NULL CHECK (amount_brl > 0),
  invoice_ref TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('expected', 'received')),
  notes TEXT,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (currency <> 'USD' OR (exchange_rate IS NOT NULL AND exchange_rate > 0)),
  CHECK (currency <> 'BRL' OR (exchange_rate IS NULL AND amount_brl = amount_original))
);

ALTER TABLE business_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business receipts" ON business_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies c
      JOIN profiles p ON p.id = c.profile_id
      WHERE c.id = business_receipts.company_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own business receipts" ON business_receipts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies c
      JOIN profiles p ON p.id = c.profile_id
      WHERE c.id = business_receipts.company_id AND p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM business_clients bc
      WHERE bc.id = business_receipts.client_id
        AND bc.company_id = business_receipts.company_id
    )
  );

CREATE POLICY "Users can update own business receipts" ON business_receipts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM companies c
      JOIN profiles p ON p.id = c.profile_id
      WHERE c.id = business_receipts.company_id AND p.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies c
      JOIN profiles p ON p.id = c.profile_id
      WHERE c.id = business_receipts.company_id AND p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM business_clients bc
      WHERE bc.id = business_receipts.client_id
        AND bc.company_id = business_receipts.company_id
    )
  );

CREATE POLICY "Users can delete own business receipts" ON business_receipts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM companies c
      JOIN profiles p ON p.id = c.profile_id
      WHERE c.id = business_receipts.company_id AND p.user_id = auth.uid()
    )
  );

CREATE INDEX idx_business_receipts_company_id ON business_receipts(company_id);
CREATE INDEX idx_business_receipts_received_on ON business_receipts(received_on);
CREATE INDEX idx_business_receipts_client_id ON business_receipts(client_id);
