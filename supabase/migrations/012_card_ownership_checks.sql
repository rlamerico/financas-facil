-- Módulo de cartões: as policies de INSERT/UPDATE das tabelas filhas conferiam só o
-- `profile_id` da própria linha. As FKs (`card_id`, `statement_id`, `exclusion_rule_id`,
-- `category_id`) não passam pelo RLS, então um usuário conseguia apontar uma linha para
-- cartão, fatura, regra ou categoria de outra pessoa. Aqui cada referência precisa
-- pertencer ao mesmo perfil (ou ser uma categoria global, quando nula no perfil).
-- Mesma classe do problema corrigido em 011_business_clients_receipts.sql.
-- SELECT e DELETE não mudam.

DROP POLICY "Users can insert own card aliases" ON card_aliases;
CREATE POLICY "Users can insert own card aliases" ON card_aliases
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
    AND EXISTS (
      SELECT 1 FROM credit_cards c
      WHERE c.id = card_aliases.card_id AND c.profile_id = card_aliases.profile_id
    )
  );

DROP POLICY "Users can update own card aliases" ON card_aliases;
CREATE POLICY "Users can update own card aliases" ON card_aliases
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  ) WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
    AND EXISTS (
      SELECT 1 FROM credit_cards c
      WHERE c.id = card_aliases.card_id AND c.profile_id = card_aliases.profile_id
    )
  );

DROP POLICY "Users can insert own card exclusion rules" ON card_exclusion_rules;
CREATE POLICY "Users can insert own card exclusion rules" ON card_exclusion_rules
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
    AND (
      card_id IS NULL
      OR EXISTS (
        SELECT 1 FROM credit_cards c
        WHERE c.id = card_exclusion_rules.card_id AND c.profile_id = card_exclusion_rules.profile_id
      )
    )
  );

DROP POLICY "Users can update own card exclusion rules" ON card_exclusion_rules;
CREATE POLICY "Users can update own card exclusion rules" ON card_exclusion_rules
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  ) WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
    AND (
      card_id IS NULL
      OR EXISTS (
        SELECT 1 FROM credit_cards c
        WHERE c.id = card_exclusion_rules.card_id AND c.profile_id = card_exclusion_rules.profile_id
      )
    )
  );

DROP POLICY "Users can insert own card statements" ON card_statements;
CREATE POLICY "Users can insert own card statements" ON card_statements
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
    AND EXISTS (
      SELECT 1 FROM credit_cards c
      WHERE c.id = card_statements.card_id AND c.profile_id = card_statements.profile_id
    )
  );

DROP POLICY "Users can update own card statements" ON card_statements;
CREATE POLICY "Users can update own card statements" ON card_statements
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  ) WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
    AND EXISTS (
      SELECT 1 FROM credit_cards c
      WHERE c.id = card_statements.card_id AND c.profile_id = card_statements.profile_id
    )
  );

DROP POLICY "Users can insert own card entries" ON card_entries;
CREATE POLICY "Users can insert own card entries" ON card_entries
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
    AND EXISTS (
      SELECT 1 FROM card_statements s
      WHERE s.id = card_entries.statement_id AND s.profile_id = card_entries.profile_id
    )
    AND EXISTS (
      SELECT 1 FROM credit_cards c
      WHERE c.id = card_entries.card_id AND c.profile_id = card_entries.profile_id
    )
    AND (
      card_entries.exclusion_rule_id IS NULL
      OR EXISTS (
        SELECT 1 FROM card_exclusion_rules r
        WHERE r.id = card_entries.exclusion_rule_id AND r.profile_id = card_entries.profile_id
      )
    )
    AND (
      card_entries.category_id IS NULL
      OR EXISTS (
        SELECT 1 FROM categories cat
        WHERE cat.id = card_entries.category_id
          AND (cat.profile_id IS NULL OR cat.profile_id = card_entries.profile_id)
      )
    )
  );

DROP POLICY "Users can update own card entries" ON card_entries;
CREATE POLICY "Users can update own card entries" ON card_entries
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  ) WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
    AND EXISTS (
      SELECT 1 FROM card_statements s
      WHERE s.id = card_entries.statement_id AND s.profile_id = card_entries.profile_id
    )
    AND EXISTS (
      SELECT 1 FROM credit_cards c
      WHERE c.id = card_entries.card_id AND c.profile_id = card_entries.profile_id
    )
    AND (
      card_entries.exclusion_rule_id IS NULL
      OR EXISTS (
        SELECT 1 FROM card_exclusion_rules r
        WHERE r.id = card_entries.exclusion_rule_id AND r.profile_id = card_entries.profile_id
      )
    )
    AND (
      card_entries.category_id IS NULL
      OR EXISTS (
        SELECT 1 FROM categories cat
        WHERE cat.id = card_entries.category_id
          AND (cat.profile_id IS NULL OR cat.profile_id = card_entries.profile_id)
      )
    )
  );
