Finanças Fácil Soluções Tecnológicas

DOCUMENTO DE REQUISITOS DE PRODUTO (PRD)

Plataforma Unificada de Gestão Financeira e Investimentos

26 de junho de 2026

---

## 1. Visão Geral

O Finanças Fácil surge como uma evolução tecnológica para usuários que buscam transcender a gestão financeira baseada em planilhas estáticas. O produto é uma plataforma robusta de gestão financeira 360°, projetada para atender tanto indivíduos (finanças pessoais/familiares) quanto pequenos negócios e autônomos que necessitam de uma separação clara, porém integrada, de seus fluxos de caixa.

O problema central resolvido é a fragmentação de dados e o esforço manual de atualização. Atualmente, o usuário depende da planilha "Finanças Familiares 2026", que embora organizada, exige inserção manual e carece de automações inteligentes. A proposta de valor do Finanças Fácil reside na automação via n8n, permitindo que extratos bancários e notas fiscais sejam processados automaticamente, alimentando dashboards em tempo real que comparam o Planejado vs. Realizado.

Os principais diferenciais incluem a gestão nativa de metas por categoria, um módulo especializado em investimentos e a capacidade de operar de forma híbrida (Web e Mobile), garantindo que o usuário tenha controle total sobre seu patrimônio, seja no escritório ou em trânsito.

## 2. Funcionalidades

### 2.1 Perfis de Usuário

O sistema operará com três níveis de acesso distintos para garantir segurança e colaboração:

1. Admin/Dono: Acesso total ao sistema, configuração de integrações n8n, gestão de contas bancárias, criação de categorias e controle de usuários.
2. Usuário Familiar/Colaborador: Pode lançar despesas e receitas, visualizar dashboards e gerenciar metas específicas, mas não possui acesso às configurações críticas de sistema ou exclusão de logs de auditoria.
3. Convidado/Visualizador: Acesso apenas para leitura de relatórios e dashboards específicos, ideal para compartilhamento com contadores ou parceiros de negócios.

### 2.2 Módulos

O sistema é composto por 10 módulos interdependentes:

1. Autenticação e Perfil: Gestão de identidade via Supabase Auth, suporte a MFA (Multi-Factor Authentication) e personalização de perfil.
2. Dashboard Financeiro: Visão consolidada do saldo atual, fluxo de caixa mensal, próximos vencimentos e status das metas principais.
3. Controle de Receitas e Despesas: Registro detalhado de transações com suporte a anexos (comprovantes) e marcação por tags.
4. Metas por Categoria: Definição de limites de gastos para as categorias herdadas da planilha (Água, Restaurante, Lavagem do Carro, Nutricionista, Aniversário, Cabelo, Sapatos, Shows, Palestras, Youtube, Plano de Saúde, Negócio).
5. Orçamento Mensal: Interface comparativa de Planejado vs. Realizado com cálculo automático de variação percentual e nominal.
6. Relatórios e Gráficos: Gerador de relatórios PDF/CSV e visualizações dinâmicas de evolução patrimonial e Pareto de gastos.
7. Gestão de Investimentos: Acompanhamento de ativos (Renda Fixa, Variável, Cripto) com atualização de preços via integração.
8. Integrações via n8n: Orquestrador central para importação de extratos bancários (Open Finance/Webhooks) e envio de notificações.
9. Exportação de Dados: Ferramenta para backup em formatos interoperáveis (JSON, Excel, CSV).
10. Configurações: Ajustes de sistema, gerenciamento de categorias e chaves de API para o n8n.

### 2.3 Páginas Principais




ID
Página
Descrição




P01
Login / Cadastro
Acesso seguro e onboarding inicial.


P02
Dashboard Principal
Visão geral financeira com widgets customizáveis.


P03
Transações
Lista cronológica de entradas e saídas com filtros avançados.


P04
Categorias e Metas
Configuração de orçamentos por categoria (ex: Nutricionista, Negócio).


P05
Planejamento Mensal
Visão tabular estilo planilha para comparação de orçamentos.


P06
Investimentos
Carteira consolidada e performance de ativos.


P07
Relatórios
Central de inteligência com gráficos de pizza, barras e linhas.


P08
Painel n8n
Status das automações e logs de integração.


P09
Contas Bancárias
Gestão de saldos e conciliação bancária.


P10
Calendário de Contas
Visualização de vencimentos em formato de calendário.


P11
Perfil do Usuário
Dados pessoais e preferências de notificação.


P12
Configurações de Sistema
Gestão de acessos e parâmetros globais.




## 3. Processos de Navegação e Fluxo

### 3.1 Fluxo do Administrador/Dono

O Administrador inicia sua jornada configurando as Categorias de Despesas baseadas na planilha histórica. Após a definição das metas mensais, ele conecta suas contas via n8n. O fluxo diário consiste na validação das transações importadas automaticamente, ajuste de categorias não identificadas e análise do dashboard de variação orçamentária para tomada de decisão.

### 3.2 Fluxo do Usuário (Familiar/Colaborador)

O Usuário secundário foca na operacionalização. Ao realizar uma compra, ele utiliza o App Mobile para fotografar o comprovante e realizar o lançamento manual (caso não seja automático). Ele recebe alertas via WhatsApp (disparados pelo n8n) quando uma categoria (ex: "Restaurante") atinge 80% do limite planejado.

### 3.3 Fluxo de Importação via n8n

O n8n atua como o coração da integração. O fluxo segue a lógica:
1. Gatilho (Webhook bancário ou Cron agendado).
2. Extração de dados (JSON/CSV).
3. Transformação e Normalização (mapeamento para as categorias do Finanças Fácil).
4. Inserção no Supabase via API REST.
5. Notificação de sucesso ou erro ao Administrador.

## 4. Design UI

### 4.1 Paleta de Cores

A interface utiliza uma paleta que transmite confiança, estabilidade e clareza financeira:

- Primária: `#2E7D32` (Verde Floresta - Representa crescimento e saúde financeira).
- Secundária: `#1565C0` (Azul Cobalto - Utilizada para investimentos e confiança).
- Sucesso: `#43A047` (Verde Esmeralda - Receitas e metas atingidas).
- Erro/Alerta: `#D32F2F` (Vermelho - Despesas e estouro de orçamento).
- Fundo: `#F5F5F5` (Cinza Claro - Neutralidade para leitura de dados).

### 4.2 Tipografia

Utilizaremos a família Inter para toda a interface devido à sua excelente legibilidade em telas pequenas e suporte a numerais tabulares, essencial para colunas financeiras. Títulos em Bold (700) e corpo de texto em Regular (400).

### 4.3 Componentes

A biblioteca de componentes será baseada em Radix UI com Tailwind CSS, incluindo:
- Data Tables com paginação e ordenação.
- Cards de resumo com Sparklines (mini gráficos de tendência).
- Modais de inserção rápida de transação.
- Date Pickers com suporte a períodos fiscais.

### 4.4 Responsividade

- Desktop: Visão completa com sidebar lateral e dashboards multi-colunas.
- Tablet: Sidebar retrátil e adaptação de tabelas para scroll horizontal.
- Mobile: Navegação via Bottom Bar, foco em ações rápidas e visualização simplificada de saldos.

## 5. Modelo de Dados

### 5.1 Diagrama Entidade-Relacionamento

O modelo é centrado na tabela profiles, que vincula usuários a suas respectivas transactions e budgets. As categories são globais ou personalizadas por perfil. A tabela budgets armazena a relação Planejado vs Realizado por mês/ano, permitindo a persistência histórica dos dados da planilha original.

### 5.2 SQL Schema

```sql
-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Perfis
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'user', 'viewer')) DEFAULT 'user',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Categorias
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT false
);

-- Tabela de Transações
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  category_id UUID REFERENCES categories(id),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed')) DEFAULT 'completed',
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Orçamentos (Planejado vs Realizado)
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  planned_amount DECIMAL(12,2) DEFAULT 0,
  actual_amount DECIMAL(12,2) DEFAULT 0,
  UNIQUE(profile_id, category_id, month, year)
);

-- Tabela de Investimentos
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  quantity DECIMAL(16,8) NOT NULL,
  average_price DECIMAL(12,2) NOT NULL,
  current_price DECIMAL(12,2),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logs de Integração n8n
CREATE TABLE integrations_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id),
  source TEXT NOT NULL,
  status TEXT,
  payload JSONB,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Exemplo de Política: Usuário só vê seus próprios dados
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = transactions.profile_id));
```

## 6. Arquitetura

### 6.1 Stack Tecnológica

- Frontend Web: React 18, TypeScript, Vite.
- Mobile: React Native (Expo) para compartilhamento de lógica de negócios.
- Estilização: Tailwind CSS (Web) e NativeWind (Mobile).
- Backend/BaaS: Supabase (PostgreSQL, Auth, Storage para comprovantes).
- Gerenciamento de Estado: Zustand (estado global) e React Query (cache de API).
- Orquestrador: n8n (Self-hosted ou Cloud).

### 6.2 Estrutura de Pastas

```text
/src
  /components     # Componentes UI reutilizáveis
  /hooks          # Custom hooks (useAuth, useTransactions)
  /services       # Chamadas API e Supabase Client
  /store          # Zustand stores
  /pages          # Componentes de página (Web)
  /screens        # Telas (Mobile)
  /utils          # Formatadores de moeda, data e cálculos
  /types          # Definições de TypeScript
```

### 6.3 Fluxo de Dados

O fluxo de dados é unidirecional. O React Query gerencia a sincronização entre o estado local e o Supabase. Quando o n8n insere uma nova transação via API, o Supabase Realtime dispara um evento que atualiza o Dashboard do usuário instantaneamente, sem necessidade de refresh.

### 6.4 Segurança

- RLS (Row Level Security): Garantia de que um usuário jamais acesse dados de outro no nível do banco de dados.
- JWT: Tokens de curta duração para todas as requisições.
- Criptografia: Dados sensíveis e chaves de API armazenados como secrets no ambiente do n8n.

### 6.5 Integrações com n8n

O n8n executará quatro fluxos críticos para o sucesso do Finanças Fácil:

1. Sincronização Bancária: Conexão com APIs de Open Finance para buscar transações diárias e categorizá-las automaticamente usando lógica condicional ou IA.
2. Notificações Inteligentes: Monitoramento da tabela budgets. Se actual_amount > planned_amount, dispara alerta via WhatsApp/Telegram.
3. Importação de Planilha: Workflow específico para ler a planilha "Finanças Familiares 2026" e realizar a carga inicial histórica para o sistema.
4. Backup Externo: Exportação semanal dos dados do Supabase para um Google Drive ou Dropbox do usuário em formato Excel.

---


Responsável pelo Produto

Local e data: São Paulo, 26 de junho de 2026

*Documento elaborado em 26 de junho de 2026. As informações contidas são de responsabilidade do solicitante.*