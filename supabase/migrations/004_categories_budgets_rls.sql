-- Fase 3 (Categorias e Metas + Planejamento Mensal) precisa que o usuário
-- consiga criar/editar/excluir as PRÓPRIAS categorias e metas (budgets).
--
-- Gap encontrado ao ler o schema real antes de implementar: a migration 001
-- só criou a policy de SELECT para `categories` (globais + próprias) e
-- SELECT/INSERT/UPDATE para `budgets` — não existe nenhuma policy de
-- INSERT/UPDATE/DELETE para `categories`, nem de DELETE para `budgets`. Sem
-- elas, RLS nega qualquer escrita por padrão (nenhuma policy = nenhum
-- acesso), então o CRUD desta fase não funcionaria sem esta migration.
--
-- `is_default IS NOT TRUE` bloqueia mexer nas categorias globais seedadas
-- na Fase 2 (`is_default = true`, `profile_id NULL`) tanto para
-- INSERT/UPDATE (usuário não pode criar/transformar uma categoria em
-- "padrão") quanto para UPDATE/DELETE (usuário não edita/exclui uma
-- categoria padrão, mesmo que de alguma forma ela tivesse profile_id
-- preenchido).

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (
    is_default IS NOT TRUE AND
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (
    is_default IS NOT TRUE AND
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (
    is_default IS NOT TRUE AND
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can delete own budgets" ON budgets
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id));
