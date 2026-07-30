-- Fase 4 (Investimentos) precisa que o usuário consiga criar/editar/excluir
-- os PRÓPRIOS investimentos.
--
-- Gap encontrado ao ler o schema real antes de implementar (mesmo tipo de
-- gap que a Fase 3 encontrou em `categories`/`budgets`): a migration 001 só
-- criou a policy de SELECT para `investments` — não existe nenhuma policy
-- de INSERT/UPDATE/DELETE. Sem elas, RLS nega qualquer escrita por padrão
-- (nenhuma policy = nenhum acesso), então o CRUD desta fase não
-- funcionaria sem esta migration.

CREATE POLICY "Users can insert own investments" ON investments
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can update own investments" ON investments
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can delete own investments" ON investments
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );
