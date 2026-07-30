-- Seed de categorias padrão (globais, profile_id NULL) — PRD §2.2 módulo 4.
-- "icon" guarda o NOME do ícone lucide-react como texto — nunca o
-- componente React — resolvido para o componente real só no client, pra
-- não repetir o bug corrigido na Fase 1 (componente React não é
-- serializável através da fronteira Server -> Client Component). "color"
-- é um hex inspirado na paleta do PRD §4.1.
--
-- Desvio do PRD: a planilha original ("Finanças Familiares 2026") só lista
-- categorias de despesa. Sem nenhuma categoria de receita não dá pra
-- classificar entradas, então "Salário" e "Outras Receitas" foram
-- adicionadas aqui (profile_id NULL, mesmo padrão das demais).
insert into public.categories (name, type, icon, color, is_default, profile_id) values
  ('Água', 'expense', 'Droplet', '#1565C0', true, null),
  ('Restaurante', 'expense', 'UtensilsCrossed', '#D32F2F', true, null),
  ('Lavagem do Carro', 'expense', 'Car', '#607D8B', true, null),
  ('Nutricionista', 'expense', 'HeartPulse', '#43A047', true, null),
  ('Aniversário', 'expense', 'Cake', '#F57C00', true, null),
  ('Cabelo', 'expense', 'Scissors', '#8E24AA', true, null),
  ('Sapatos', 'expense', 'Footprints', '#6D4C41', true, null),
  ('Shows', 'expense', 'Music', '#D81B60', true, null),
  ('Palestras', 'expense', 'Presentation', '#3949AB', true, null),
  ('Youtube', 'expense', 'Youtube', '#E53935', true, null),
  ('Plano de Saúde', 'expense', 'ShieldPlus', '#00897B', true, null),
  ('Negócio', 'expense', 'Briefcase', '#5D4037', true, null),
  ('Salário', 'income', 'Wallet', '#2E7D32', true, null),
  ('Outras Receitas', 'income', 'PiggyBank', '#43A047', true, null);

-- Habilita Realtime (postgres_changes) na tabela transactions. As policies
-- de RLS já existentes (SELECT por dono via profile_id) continuam sendo
-- aplicadas automaticamente nos eventos entregues via replicação.
alter publication supabase_realtime add table transactions;
