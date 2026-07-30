-- Integração com a planilha "Finanças Familiares 2026" (sync espelho).
--
-- `source` identifica a origem de cada transação ('manual' = criada no app,
-- 'sheet' = importada da planilha, 'n8n' = webhook n8n; futuras: 'whatsapp').
-- A reconciliação do espelho SÓ toca transações com source = 'sheet' —
-- nunca as criadas manualmente ou por outras integrações.
--
-- `external_ref` é o ID estável da linha na planilha (UUID gravado pelo
-- Apps Script numa coluna auxiliar). O índice único parcial é a chave de
-- idempotência: reenviar o mesmo snapshot não duplica nada.
ALTER TABLE transactions
  ADD COLUMN source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN external_ref TEXT,
  ADD COLUMN payment_method TEXT;

CREATE UNIQUE INDEX idx_transactions_profile_external_ref
  ON transactions(profile_id, external_ref)
  WHERE external_ref IS NOT NULL;

-- RLS já está habilitado em `transactions` (001) com policies por
-- profile_id; as colunas novas não mudam o modelo de acesso. O endpoint
-- de sync roda com service_role (bypassa RLS) e valida o profile_id
-- explicitamente, igual ao webhook n8n.
