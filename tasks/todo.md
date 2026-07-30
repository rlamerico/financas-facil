# TODO — Finanças Fácil

## Integração Planilha → Sistema (implementada — 2026-07-04)

Sync **espelho** da planilha "Finanças Familiares 2026" via Google Apps
Script → `POST /api/webhooks/sheet-sync`. Decisões do usuário: Apps Script
(sem n8n), espelho completo (edições/exclusões sincronizam), destino perfil
admin. Estrutura real da planilha analisada do export em `files/` (6 abas
mensais, ~714 lançamentos, ENTRADAS + Planejado×Realizado + Controle
Financeiro).

- [x] Migração `008_sheet_sync.sql` — `transactions.source/external_ref/payment_method` + índice único parcial (idempotência)
- [x] `utils/sheet-sync/reconcile.ts` (TDD, 14 testes) — normalização de categoria, regra de data (mês da aba manda), diff espelho
- [x] `utils/validation/sheet-sync-schema.ts` (+5 testes) — Zod do snapshot
- [x] `utils/webhook-auth.ts` — secret timing-safe extraído (DRY com rota n8n; n8n agora marca `source='n8n'`)
- [x] Rota `POST /api/webhooks/sheet-sync` — secret + Zod + reconciliação por mês (categorias auto-criadas, upsert budgets `planned_amount`) + `integrations_log`
- [x] `scripts/apps-script/sheet-sync.gs` + README — gatilhos 15min/edição, refs UUID na coluna R, secret em Script Properties
- [x] Verificação: 154/154 testes ✓ · typecheck ✓ · lint ✓ · build ✓
- [x] **Carga inicial executada (2026-07-04)**: migração 008 aplicada via Management API; snapshot do xlsx enviado ao endpoint local → 707 transações (694 despesas + 13 rendas), 355 budgets, 86 categorias; idempotência comprovada (meses reenviados = no-op); fix: dedupe de budgets por category_id
- [ ] Setup do Apps Script na planilha real (README) — 1º sync vai regenerar refs (recria as 707, converge); `SHEET_SYNC_SECRET` no Vercel
- [ ] Pós-validação: entrada de valores via WhatsApp (próxima integração) e frontend

## Design Refresh "Ledger em Camadas" (em andamento — 2026-07-04)

Branch: `feat/design-refresh`. Direção: sair do flat-cinza para camadas com
profundidade (sombras duplas, hero card de saldo com gradiente da marca,
sparkline em área), dark mode via `next-themes`, e 3D só em CSS
(tilt na landing, hover lift em cards). Sem three.js.

- [x] Fase 1 — Tokens: ramps primary/secondary, neutros com tint, sombras, radius, motion, dark mode (`@theme inline` + `.dark` via next-themes)
- [x] Fase 2 — Primitivos: `card.tsx` (flat/elevated/hero), polish `button.tsx`, `stat-card.tsx` com delta, sparkline com área em gradiente
- [x] Fase 3 — Shell: sidebar (indicador ativo), topbar (avatar iniciais + blur + toggle de tema), bottom bar mobile (pill ativo + safe-area)
- [x] Fase 4 — Dashboard: hero card de Saldo, stat cards com delta (`period-comparison` com TDD, janela 60d), lista polida + skeleton
- [x] Fase 5 — Landing: hero assimétrico com mockup 3D CSS (tilt ≤8°, motion-reduce off), mesh gradient, scroll-reveal progressivo
- [x] Fase 6 — Consistência: 19 arquivos de views migrados pro padrão `rounded-lg + shadow-card` (modais → `shadow-overlay + animate-fade-up`)
- [x] Fase 7 — Verificação: 135/135 testes ✓ · typecheck ✓ · lint ✓ · build ✓ · smoke HTML/CSS ✓ (screenshots pendentes — sem Chrome na máquina)

### Review do Design Refresh (2026-07-04)

- **Novos arquivos**: `ui/card.tsx`, `ui/stat-card.tsx`, `layout/theme-toggle.tsx`,
  `landing/hero-mockup.tsx`, `utils/period-comparison.ts(.test)`, `utils/initials.ts(.test)`.
- **Dark mode**: next-themes (`attribute="class"`, system default) + tokens semânticos
  `--tone-*`/`--elev-*` flipando em `.dark`; acentos clareados p/ contraste AA no escuro.
- **Verificado**: build de produção limpo; script anti-FOUC do next-themes injetado;
  CSS compilado contém `.dark` (19 seletores), sombras e keyframes.
- **Pendente (manual)**: conferir visualmente no browser (dev server em
  `localhost:3000`) claro/escuro/mobile; screenshots não foram possíveis
  (Chrome/extensão indisponíveis nesta máquina).
- **Nota de contraste pré-existente**: valores verdes `#43A047` sobre branco têm
  ~3:1 (abaixo de AA p/ texto pequeno) — já era assim antes do refresh; se quiser,
  escurecer para `primary-600`/`700` em texto pequeno numa rodada futura.

## MVP completo (Fases 0–9)

**Concluído em 2026-07-01.** Todas as 9 fases do roteiro foram implementadas e
verificadas (`typecheck`/`lint`/`test`/`build` limpos em cada uma). As 12
páginas do PRD (§2.2) estão no ar: **P01** Landing pública, **P02**
Dashboard, **P03** Transações, **P04** Categorias, **P05** Planejamento
Mensal (Planejado × Realizado), **P06** Investimentos (preço manual — API de
cotação automática fica pendente, ver abaixo), **P07** Relatórios (gráficos +
export CSV/JSON), **P08** Painel n8n (webhook receptor + logs, admin-only),
**P09** Contas Bancárias, **P10** Calendário de Contas, **P11** Perfil, e
**P12** Configurações de Sistema (gestão de usuários + Exportação de Dados,
Fase 9, admin-only). **Nada foi commitado em nenhuma fase** — o repositório
inteiro segue como mudanças não commitadas (`git status` mostra tudo como
`??`/modificado desde o início do projeto), aguardando revisão manual no
browser e decisão do usuário sobre quando/como commitar. Duas decisões
ficaram pendentes de configuração externa do usuário (fora do meu alcance):
API de cotação automática de ativos (Investimentos, Fase 4) e setup real do
n8n em produção (Fase 6 construiu só o lado receptor).

## Fase 0 — Fundação & Setup

- [x] git init + `.gitignore` (`.env` antes de qualquer código) + `.env.example`
- [x] Scaffold Next.js 15 (App Router) + TypeScript + Tailwind + ESLint + `src/` + alias `@/*`
- [x] Radix UI + design tokens (paleta PRD §4.1) + fonte Inter
- [x] Otimizar logo + gerar favicon
- [x] Cliente Supabase (`@supabase/ssr`) + estrutura de pastas (`services`, `hooks`, `store`, `utils`, `types`)
- [x] Esqueleto da landing page pública
- [x] Atualizar seção `Commands` do CLAUDE.md com scripts reais (npm)
- [x] Rodar `npm run dev` e validar localmente

## Review

**Concluído em 2026-06-28.** Fundação da aplicação no ar.

### O que foi feito
- **Scaffold**: Next.js 16.2.9 (App Router, Turbopack) + React 19 + TS + Tailwind v4 + ESLint 9.
- **Design system** (`globals.css`): tokens da paleta PRD §4.1 (`primary` #2E7D32, `secondary`
  #1565C0, `success`, `error`, `background` etc.) + fonte **Inter** via `next/font` + util
  `tabular-nums` para colunas financeiras.
- **Assets**: logo otimizado 5.1 MB → ~99 KB (`public/logo.png`, fundo transparente);
  favicon + apple-touch + icons PWA 192/512 gerados a partir só da marca (gráfico/seta).
- **Supabase**: clients browser (`createBrowserClient`) e server (`createServerClient` + cookies)
  em `src/services/supabase/`; `Database` placeholder em `src/types/database.ts`.
- **Estrutura**: `src/{components,services,hooks,store,utils,types}` (PRD §6.2).
- **Landing pública**: header com logo + CTAs, hero, grid de 6 features, footer — usando o
  componente `Button` (cva + Radix Slot) e os tokens de marca.
- **CLAUDE.md**: seção Commands real (npm) + setup de ambiente documentado.

### Verificação
- `npm run typecheck` ✓ · `npm run lint` ✓ (No issues) · `npm run build` ✓ (`/` prerender estático)
- `npm run dev` ✓ — HTTP 200 em `/`, `/logo.png`, `/favicon.ico`; conteúdo renderiza.
- `npm audit`: high do Next corrigido (16.2.4 → 16.2.9). Resta 1 *moderate* transitiva
  (`postcss` empacotado dentro do Next, build-time, não aplicável ao app; só some quando o
  Next publicar update). Sem críticas/high.

### Gotchas de ambiente (documentados no CLAUDE.md)
- Projeto vive **dentro do Google Drive** → `node_modules` é symlink p/ disco local
  (`~/.local/share/node-modules/financas-facil`), senão `npm install` não termina.
- Proxy TLS corporativo (`SELF_SIGNED_CERT_IN_CHAIN`) → `npm config set cafile` apontando p/
  bundle de CAs do sistema (sem desabilitar strict-ssl).

### Pendências / decisões para a próxima fase
- Primeiro commit ainda **não** feito (aguardando sua aprovação — workflow exige branch + sua autorização).
- Rotas `/login` e `/signup` referenciadas na landing ainda não existem (Fase de Auth).
- React Query / Zustand instalados mas ainda sem provider (serão ligados quando houver consumo de dados).
- Criar schema SQL (PRD §5.2) com RLS no Supabase.

## Fase 1 — Autenticação & Shell do App

- [x] Test runner: `vitest` + `@testing-library/*` + `jsdom`, scripts `test`/`test:watch`
- [x] `zod` instalado para validação de schema nos forms
- [x] `supabase/migrations/002_profile_bootstrap.sql` — trigger `SECURITY DEFINER` em
      `auth.users` que popula `public.profiles` (primeiro usuário vira `admin`, demais `user`)
      + `REVOKE EXECUTE` de `public/anon/authenticated`
- [x] `src/types/database.ts` regenerado a partir do schema real (via `supabase gen types`)
- [x] `src/services/supabase/middleware.ts` (`updateSession`) + `middleware.ts` (raiz) —
      renova sessão via `getClaims()` e redireciona para `/login` fora da allowlist pública
- [x] `src/utils/validation/auth-schemas.ts` (+ `.test.ts`) — `loginSchema`/`signupSchema`
- [x] Server Actions de auth: `src/app/login/actions.ts`, `src/app/signup/actions.ts`,
      `src/app/(app)/actions.ts` (`signOut`)
- [x] Único Route Handler: `src/app/auth/callback/route.ts` (troca `code` por sessão)
- [x] `src/components/auth/{auth-card,login-form,signup-form}.tsx` — `useActionState`/`useFormStatus`
- [x] `src/app/login/page.tsx`, `src/app/signup/page.tsx`
- [x] Shell protegido `src/app/(app)/layout.tsx` — `getClaims()` + busca de `profiles` +
      `Sidebar`/`Topbar`/`MobileBottomBar` (defesa em profundidade além do middleware)
- [x] `src/app/(app)/dashboard/page.tsx` — placeholder "Bem-vindo, {nome}" + badge de role
- [x] `src/components/layout/nav-items.ts` (+ `.test.ts`) — 11 itens P02–P12,
      `getNavItemsForRole`, só Dashboard ativo (resto "Em breve")
- [x] `src/components/layout/{sidebar,topbar,mobile-bottom-bar}.tsx`
- [x] `src/components/providers.tsx` (React Query) ligado em `src/app/layout.tsx`

## Review (Fase 1)

**Concluído em 2026-06-30.**

### O que foi feito
- **Banco de dados**: migration `002_profile_bootstrap.sql` aplicada no remoto via
  `supabase db push` (após `supabase link` + `supabase migration repair --status applied 001`,
  já que a 001 tinha sido colada manualmente no SQL Editor e não constava no histórico do CLI).
  `supabase migration list` confirma `001`/`002` sincronizadas local↔remoto.
- **Tipos**: `src/types/database.ts` regenerado via `supabase gen types typescript` com as 6
  tabelas reais (antes era placeholder vazio).
- **Auth**: middleware (`getClaims()`, sem round-trip) renovando cookies e redirecionando rotas
  não-públicas; layout `(app)` faz a checagem de autorização de novo (defesa em profundidade);
  login/signup via Server Actions + `useActionState`; único Route Handler é o callback de
  confirmação de e-mail.
- **Shell**: sidebar desktop fixa, topbar com dropdown (Radix, pacote unificado `radix-ui`) e
  bottom bar mobile, todos dirigidos por `nav-items.ts` — só "Dashboard" tem rota real, os
  outros 10 itens aparecem com badge "Em breve". "Painel n8n" e "Configurações de Sistema"
  restritos a `admin`.
- **Testes**: 12 testes (`auth-schemas.test.ts`, `nav-items.test.ts`) cobrindo validação de
  login/signup e regra de visibilidade de menu por role.

### Verificação
- `npm run typecheck` ✓ · `npm run lint` ✓ (No issues) · `npm test` ✓ (12/12)
- `npm run build` ✓ — rotas geradas: `/` `/login` `/signup` estáticas, `/dashboard` e
  `/auth/callback` dinâmicas, middleware ativo.
- `npm run dev` + curl: `/` `/login` `/signup` → 200; `/dashboard` deslogado → **307** com
  `location: /login` (prova middleware + layout protegendo a rota).
- Advisors de segurança (Management API `/advisors/security`, MCP do Supabase não disponível
  nesta sessão): só 2 WARN, ambos sobre uma função pré-existente `public.rls_auto_enable()`
  (não criada por nós). **Nenhum finding sobre `handle_new_user`** — o `REVOKE EXECUTE` funcionou.

### Desvios em relação ao plano
- MCP `mcp__supabase__*` não estava disponível nesta sessão (apesar do `.mcp.json` configurado)
  — usei o CLI `supabase` (link + migration repair + db push + gen types) e a Management API
  via `curl` para os advisors, como fallback documentado no plano.
- Migration 001 precisou de `supabase migration repair --status applied 001` antes do `db push`,
  porque tinha sido aplicada manualmente (colada no SQL Editor) e não constava no histórico de
  migrations do CLI — sem isso, `db push` tentaria recriar as tabelas já existentes.
- Servidor de dev já estava rodando há ~30 min numa sessão anterior do usuário (PID antigo,
  porta 3000); a nova instância em background entrou em conflito de lock e saiu sozinha — os
  testes de rota via curl foram feitos contra a instância já em execução (porta 3000), que
  recarregou o código novo via Turbopack HMR.

### QA manual no browser — 2 bugs encontrados e corrigidos
- **`Failed to fetch` no signup**: `next dev` rodava sem `NODE_EXTRA_CA_CERTS` → Node não
  validava o TLS do proxy corporativo ao chamar a API do Supabase (`SELF_SIGNED_CERT_IN_CHAIN`).
  Confirmado isolando a chamada em Node puro (falha sem a var, `OK 401` com ela). Fix definitivo:
  `scripts/dev.sh` (novo) exporta a var condicionalmente e agora é o que `npm run dev` chama;
  `build`/`start` (Vercel) não foram tocados. Documentado como 3º gotcha no `CLAUDE.md`.
- **Erro de hidratação (`data-lt-installed`)**: atributo injetado por extensão do navegador
  (LanguageTool) antes do React hidratar — não era bug do app. Fix: `suppressHydrationWarning`
  na tag `<html>` (`src/app/layout.tsx`), padrão recomendado pelo Next.js para esse cenário.
- **`Only plain objects can be passed to Client Components`**: `Sidebar` e `MobileBottomBar`
  (Client Components) recebiam o array `NAV_ITEMS` inteiro — incluindo os componentes de ícone
  do `lucide-react` — como prop calculada no Server Component `(app)/layout.tsx`. Componentes
  React não são serializáveis pela fronteira RSC→Client. Fix: os dois passaram a receber só
  `role` (string) e chamam `getNavItemsForRole` internamente; varri o resto do `src/` e nenhum
  outro Client Component tinha o mesmo padrão de risco (`Topbar`/`AuthCard`/forms só recebem
  strings ou JSX já renderizado, que é seguro).

### Verificação final (pós-QA)
- Login real (`rlamerico@gmail.com`) direto contra o Supabase confirmou: usuário virou **admin**
  (primeiro da base), perfil criado pelo trigger corretamente.
- `npm run typecheck` ✓ · `npm run lint` ✓ · `npm test` ✓ (12/12) · `npm run build` ✓ — todos
  re-rodados depois dos 3 fixes acima.
- **Teste ponta-a-ponta no browser confirmado pelo usuário**: cadastro → 1º usuário = admin →
  login → `/dashboard` renderiza nome "Rodrigo Americo" + badge **Admin** + sidebar com as 11
  páginas (só Dashboard ativo, resto "Em breve", "Painel n8n"/"Configurações" corretamente
  restritos por role) → screenshot anexado na conversa.
- Logout (`src/app/(app)/actions.ts`) revisado por leitura de código — mesmo padrão de client
  server-side já validado no login; não foi clicado na UI nesta sessão.

### Pendências / próximos passos
- Decidir se quer comitar agora (nada foi commitado, conforme instrução) e revisar localmente
  antes da Fase 2 (Dashboard real + Transações + Realtime).
- `npm audit`: 2 vulnerabilidades *moderate* (mesma situação herdada da Fase 0, transitivas de
  build, não bloqueantes).

## Fase 2 — Dashboard (P02) & Transações (P03)

- [x] `supabase/migrations/003_seed_categories.sql` — 12 categorias de despesa do PRD +
      "Salário"/"Outras Receitas" (desvio documentado) + `ALTER PUBLICATION supabase_realtime
      ADD TABLE transactions`
- [x] `src/utils/validation/transaction-schema.ts` (+ `.test.ts`) — zod: descrição, valor > 0,
      data, categoria (nullable), tipo (income/expense); `toSignedAmount()` deriva o sinal
- [x] `src/utils/finance-summary.ts` (+ `.test.ts`) — `summarizeTransactions()` pura
- [x] `src/components/ui/sparkline.tsx` (+ `.test.ts`) — sparkline SVG puro; `buildSparklinePoints()`
      extraída como função pura testável
- [x] `src/hooks/use-categories.ts` — `useCategories()` (React Query)
- [x] `src/hooks/use-transactions.ts` — `useTransactions(profileId, filters, pageSize)`
      (`useInfiniteQuery` + assinatura Realtime via `postgres_changes`), `useCreateTransaction`,
      `useUpdateTransaction`, `useDeleteTransaction`
- [x] `src/app/(app)/transacoes/page.tsx` + `src/components/transactions/{transactions-view,
      transaction-form,transaction-row}.tsx` — filtros (mês/ano/categoria/tipo), lista
      paginada "carregar mais", modal Radix `Dialog` de criar/editar, excluir com confirmação
- [x] `src/app/(app)/dashboard/page.tsx` (reescrito) + `src/components/dashboard/dashboard-content.tsx`
      — 3 cards (saldo/receitas/despesas dos últimos 30 dias), sparkline de saldo acumulado,
      5 transações recentes com link "ver todas"
- [x] `src/components/layout/nav-items.ts` — `comingSoon: true` removido de P03 (Transações)

## Review (Fase 2)

**Concluído em 2026-06-30.**

### O que foi feito
- **Banco de dados**: migration `003_seed_categories.sql` aplicada via `supabase db push`
  (14 categorias globais `profile_id NULL` + Realtime habilitado em `transactions`).
  `supabase migration list` confirma `001`/`002`/`003` sincronizadas local↔remoto.
- **Lógica pura + testes**: `transaction-schema.ts` (zod, deriva sinal do valor pelo tipo),
  `finance-summary.ts` (`summarizeTransactions`), `sparkline.tsx` (`buildSparklinePoints`) —
  18 testes novos, todos passando.
- **Convenção de sinal**: `transactions.amount` é armazenado com sinal (receita positiva,
  despesa negativa), decidido no formulário via `toSignedAmount()`. Isso deixa
  `summarizeTransactions` trivial (soma direta) e não exigiu nenhuma coluna nova.
- **Hooks**: `useTransactions` usa `useInfiniteQuery` (paginação "carregar mais", 20/página por
  padrão, configurável — o Dashboard usa 200 pra cobrir os últimos 30 dias numa única página) e
  assina `postgres_changes` (`event: "*"`, filtro por `profile_id`), invalidando a query React
  Query quando chega um evento — é isso que faz Dashboard e lista de Transações atualizarem
  sozinhos.
- **UI Transações**: filtros de mês/ano/categoria/tipo, lista com "carregar mais", modal Radix
  `Dialog` (pacote unificado `radix-ui`) reaproveitado pra criar/editar, exclusão com
  `window.confirm`.
- **UI Dashboard**: 3 `SummaryCard`s, `Sparkline` de saldo acumulado (SVG puro, sem lib de
  gráfico), 5 transações recentes + link "Ver todas" pra `/transacoes`.
- **Regra de ouro respeitada**: nos dois `page.tsx` novos, o único dado que atravessa a
  fronteira Server → Client é `profileId` (string/UUID). Nenhum ícone `lucide-react` nem
  objeto complexo é passado como prop de Server para Client Component.

### Verificação
- `npm run typecheck` ✓ · `npm run lint` ✓ (1 erro `react-hooks/immutability` encontrado e
  corrigido — ver "Desvios" abaixo) · `npm test` ✓ (**30/30**, 5 arquivos de teste)
- `npm run build` ✓ — sem erros de serialização RSC. Rotas: `/dashboard` e `/transacoes`
  dinâmicas (`ƒ`), `/` `/login` `/signup` estáticas, middleware ativo.
- `npm run dev` + `curl`: `/transacoes` e `/dashboard` deslogado → **307** com
  `location: /login` (mesmo teste da Fase 1, agora cobrindo a rota nova também).
- **Teste ponta-a-ponta real** (script Node com `@supabase/supabase-js`, mesma abordagem da
  Fase 1): login com `rlamerico@gmail.com` → busca `profiles.id` → confirma as 14 categorias
  seed (12 despesa + 2 receita) → insere 3 transações reais (1 receita "Salário do mês"
  R$5000, 2 despesas "Conta de água" R$120,50 e "Jantar fora" R$89,90, categorias diferentes)
  → SELECT confirma as 3 → valida manualmente que bate com a lógica de `summarizeTransactions`
  (income=5000, expenses=210,40, balance=4789,60) → **DELETE das 3 transações de teste** →
  SELECT pós-delete confirma 0 registros restantes. Base do usuário real ficou limpa.

### Desvios em relação ao plano
- **Categoria de receita não estava no PRD**: como sinalizado no próprio plano, a planilha
  original só lista despesas; adicionei "Salário" e "Outras Receitas" (mesmo padrão de seed,
  `profile_id NULL`) porque sem categoria de receita não dá pra classificar entradas.
- **`pageSize` configurável em `useTransactions`**: o plano não detalhava como o Dashboard
  reconciliaria "últimos 30 dias" com a paginação de 20/página da lista de Transações. Adicionei
  um terceiro parâmetro opcional (`pageSize`, default 20) — a página de Transações usa o padrão,
  o Dashboard passa 200 pra somar o período inteiro numa única página. É uma simplificação de
  MVP: se um perfil tiver mais de 200 transações em 30 dias, o resumo ficaria truncado; aceitável
  pro volume esperado de uso doméstico/pequena empresa desta fase.
- **Erro de lint não previsto**: `dashboard-content.tsx` usava `let running` reatribuído dentro
  de um `.map()` num `useMemo` pra calcular o saldo acumulado do sparkline — a regra
  `react-hooks/immutability` (plugin novo do `eslint-config-next` desde a v16) bloqueia
  reatribuição de variável local dentro de render. Troquei por `reduce` imutável
  (`[...cumulative, novoValor]`). Sem impacto de performance perceptível dado o volume de dados
  (≤200 itens).
- **Bug no meu próprio script de teste, não no código do produto**: a primeira rodada do
  teste e2e tinha uma assertiva de saldo esperado errada (`4789.5` em vez de `4789.6` —
  erro de aritmética manual minha, não do `summarizeTransactions`). O script falhou *depois*
  de inserir as 3 transações de teste e *antes* do passo de limpeza, deixando lixo temporário
  na base real por alguns minutos. Rodei uma limpeza imediata (`DELETE ... WHERE description
  ILIKE '%[TESTE FASE2]%'`) confirmando 0 registros restantes, corrigi a asserção e re-rodei o
  fluxo completo do zero com sucesso e limpeza normal ao final. Lição pra próxima vez: o script
  de teste deveria envolver os passos 4–7 num `try/finally` pra garantir limpeza mesmo se uma
  assertiva no meio falhar — vale aplicar esse padrão na Fase 3.

### Confirmação de limpeza de dados de teste
Confirmado por duas vias independentes: (1) o próprio script e2e fez `SELECT` pós-`DELETE` e
verificou 0 linhas; (2) uma query adicional de auditoria (`ILIKE '%TESTE%'` na descrição, sem
depender dos IDs específicos) rodada depois, também retornou 0 linhas. Nenhuma transação de
teste ficou na base do usuário real (`rlamerico@gmail.com`).

### Pendências / próximos passos
- Commit ainda não feito (aguardando aprovação, conforme instrução) — inclui Fase 1 + Fase 2
  juntas, já que a Fase 1 também não tinha sido commitada.
- **Usuário precisa validar no browser**: criar uma transação via modal e ver a lista/dashboard
  atualizarem sem refresh manual (prova visual do Realtime, que só foi validado via
  `postgres_changes` habilitado na migration + lógica do hook, não clicado na UI nesta sessão);
  testar edição/exclusão de transação pela UI; testar os filtros de mês/categoria/tipo na
  página de Transações; conferir responsividade mobile (bottom bar já linka pra `/transacoes`).
- Página de gestão de Categorias/Metas (P04) continua fora de escopo — fica pra Fase 3.
- `npm audit`: mesma situação moderate/transitiva herdada das fases anteriores.

## Fase 3 — Categorias e Metas (P04) & Planejamento Mensal (P05)

- [x] `supabase/migrations/004_categories_budgets_rls.sql` — policies de INSERT/UPDATE/DELETE
      para `categories` (só categorias próprias, nunca `is_default`) e DELETE para `budgets`
      (gap encontrado no schema real: só existiam SELECT/INSERT/UPDATE)
- [x] `src/utils/validation/category-schema.ts` (+ `.test.ts`) — zod: nome, tipo, cor/ícone opcionais
- [x] `src/utils/validation/budget-schema.ts` (+ `.test.ts`) — zod: categoria, mês 1-12, ano,
      valor planejado ≥ 0
- [x] `src/utils/budget-variance.ts` (+ `.test.ts`) — `calculateBudgetVariance()` pura: cruza
      metas com transações do período e devolve planejado/realizado/variação/percentual
- [x] `src/utils/month-labels.ts` — `MONTH_LABELS` extraído de `transactions-view.tsx` (Fase 2)
      pra reuso em Metas/Planejamento sem duplicar o array
- [x] `src/hooks/use-categories.ts` — mutations `useCreateCategory`, `useUpdateCategory`,
      `useDeleteCategory` adicionadas ao hook existente
- [x] `src/hooks/use-budgets.ts` — `useBudgets(profileId, month, year)` + `useCreateBudget`,
      `useUpdateBudget`, `useDeleteBudget`
- [x] `src/app/(app)/categorias/page.tsx` + `src/components/categories/{categories-view,
      category-form,category-row}.tsx` — CRUD de categorias próprias (categorias padrão
      somente leitura na UI)
- [x] `src/components/budgets/{budgets-section,budget-form,budget-row}.tsx` — CRUD de metas
      (seletor de mês/ano + lista + modal), seção "Metas" da própria página de Categorias
- [x] `src/app/(app)/planejamento/page.tsx` + `src/components/budgets/planning-view.tsx` —
      tabela Planejado × Realizado × Variação × % por categoria, com totais
- [x] `src/components/layout/nav-items.ts` — `comingSoon: true` removido de P04 e P05

## Review (Fase 3)

**Concluído em 2026-06-30.**

### O que foi feito
- **Banco de dados**: migration `004_categories_budgets_rls.sql` aplicada via `supabase db push`
  (`supabase migration list` confirma `001`-`004` sincronizadas local↔remoto). Adiciona as
  policies de RLS que faltavam pra escrita em `categories` (INSERT/UPDATE/DELETE, sempre
  `is_default IS NOT TRUE`) e `budgets` (DELETE) — ver "Desvios" abaixo, o brief da fase
  presumia que essas policies já existiam e não presumiam corretamente.
- **Lógica pura + testes**: `category-schema.ts`, `budget-schema.ts` (zod, mesmo padrão de
  `transaction-schema.ts`), `budget-variance.ts` (`calculateBudgetVariance` — soma o valor
  absoluto das transações da categoria/mês como "realizado", nunca lê `budgets.actual_amount`
  que fica facilmente desatualizado) — 18 testes novos, todos passando.
- **Hooks**: `useCategories` ganhou `useCreateCategory`/`useUpdateCategory`/`useDeleteCategory`
  no mesmo arquivo (padrão pedido); `useUpdateCategory`/`useDeleteCategory` não recebem
  `profileId` porque não precisam dele (RLS resolve o dono via `auth.uid()`, a query key de
  categorias não é escopada por perfil) — só `useCreateCategory` usa pra preencher
  `profile_id` no INSERT. `useBudgets(profileId, month, year)` segue o padrão de
  `useTransactions` mas sem assinatura Realtime (metas mudam por ação direta do usuário, não
  por integração externa — invalidação via mutation já é suficiente).
- **UI Categorias**: lista com categorias padrão (somente leitura, badge "Padrão") e próprias
  (editar/excluir), modal Radix `Dialog` de criar/editar com seletor de tipo, cor (`input
  type="color"`) e ícone opcional (texto livre, nome de ícone lucide-react — mesma convenção
  da seed da Fase 2, não resolvido pra componente visual nesta fase). Exclusão trata violação
  de FK (`code === "23503"`, categoria em uso em transações/metas) com mensagem amigável em
  vez de erro genérico.
- **UI Metas**: seção "Metas" na mesma página de Categorias (não uma rota própria — criar meta
  depende da categoria já existir), seletor de mês/ano, CRUD completo. Em edição, categoria/
  mês/ano ficam travados (só `planned_amount` é editável — index único
  `profile_id+category_id+month+year` não permite reatribuir). Meta duplicada mostra mensagem
  amigável (`code === "23505"`) em vez de erro genérico.
- **UI Planejamento Mensal**: tabela Planejado × Realizado × Variação × % por categoria pro
  mês/ano selecionado, com linha de totais; realizado calculado ao vivo cruzando
  `useBudgets` + `useTransactions` via `calculateBudgetVariance`. Estado vazio linka de volta
  pra "Gerenciar metas" em `/categorias`.
- **Regra de ouro respeitada**: nos dois `page.tsx` novos, o único dado que atravessa a
  fronteira Server → Client é `profileId` (string/UUID) — mesmo padrão de `transacoes` e
  `dashboard`.

### Verificação
- `npm run typecheck` ✓ · `npm run lint` ✓ ("No issues found" — 2 warnings de
  `@typescript-eslint/no-unused-vars` apareceram no meio do trabalho por causa do `profileId`
  não usado em `useUpdateCategory`/`useDeleteCategory`; corrigido removendo o parâmetro em vez
  de silenciar o lint, ver "Desvios") · `npm test` ✓ (**48/48**, 8 arquivos de teste — os 30
  testes das Fases 1/2 continuam passando + 18 novos desta fase)
- `npm run build` ✓ — sem erros de serialização RSC. Rotas novas `/categorias` e
  `/planejamento` dinâmicas (`ƒ`), mesmo padrão de `/transacoes`/`/dashboard`.
- Porta 3000 verificada livre (`lsof -i :3000`) antes de subir `npm run dev` em background.
  `curl` confirma `/categorias`, `/planejamento`, `/transacoes` e `/dashboard` deslogado →
  **307** com `location: /login`.
- **Teste ponta-a-ponta real** (script Node com `@supabase/supabase-js`, mesma abordagem das
  Fases 1/2 — sem browser automation disponível — agora com todos os passos de criação +
  asserção dentro de um `try/finally`, lição da Fase 2): login com `rlamerico@gmail.com` →
  confirma as 14 categorias padrão → cria 2 categorias próprias de teste → edita uma → confirma
  que RLS bloqueia UPDATE/DELETE em categoria padrão (0 linhas afetadas, sem erro) → cria 2
  metas (categoria própria de teste + categoria padrão "Salário") → confirma que meta duplicada
  viola a constraint UNIQUE (`code 23505`) → edita `planned_amount` de uma meta → insere 3
  transações reais no mês corrente (2 despesas -80/-95,50 na categoria de teste, 1 receita
  +4500 em "Salário") → recalcula `calculateBudgetVariance` manualmente com os dados batidos
  contra a query real (realizado despesa = 175,50, variance = 74,50; realizado salário = 4500)
  → confirma que excluir a categoria em uso falha por violação de FK (`code 23503`) → **limpa
  tudo no `finally`** (transações → metas → categorias, nessa ordem por causa das FKs) →
  auditoria independente por tag `[TESTE FASE3]` confirma 0 registros restantes nas 3 tabelas.
  22 asserções, todas passaram (`TUDO OK`). Base do usuário real ficou limpa.

### Desvios em relação ao plano
- **RLS de `categories`/`budgets` não estava completa como o brief presumia**: o brief da fase
  dizia "RLS de categories já permite SELECT... budgets já tem SELECT/INSERT/UPDATE por dono.
  Não precisa mexer em RLS nesta fase." Ao ler a migration 001 real, `categories` só tinha
  policy de SELECT (nenhuma de INSERT/UPDATE/DELETE) e `budgets` não tinha DELETE. Sem essas
  policies, RLS nega qualquer escrita por padrão — o CRUD desta fase simplesmente não
  funcionaria. Criei a migration 004 com as 4 policies que faltavam (documentado no próprio
  SQL) e apliquei via `supabase db push`.
- **Ícone da categoria não é renderizado visualmente nesta fase**: o campo `icon` (texto,
  nome de ícone lucide-react) é editável no formulário mas a lista de categorias mostra só um
  swatch de cor, não o ícone de fato. Decisão de escopo: não havia nenhum resolvedor de
  "nome de ícone → componente" estabelecido nas Fases 1/2 pra seguir como padrão, e adicionar
  um agora (`import * as Icons from "lucide-react"`) era escopo extra não pedido no plano.
  Simples de adicionar depois se quiserem os ícones visíveis na lista.
- **`useUpdateCategory`/`useDeleteCategory` não recebem `profileId`**: o brief pedia pra seguir
  "o mesmo estilo" de `useUpdateTransaction`/`useDeleteTransaction` (que recebem `profileId`),
  mas nesses dois casos específicos o parâmetro ficava sem uso real (a query key de categorias
  não é escopada por perfil, e RLS já resolve o dono via `auth.uid()`) — `eslint` acusou
  `no-unused-vars`. Em vez de prefixar com `_` só pra calar o lint, removi o parâmetro: mais
  simples, mais honesto sobre o que a função realmente precisa. `useCreateCategory` continua
  recebendo `profileId` porque usa de verdade (preenche `profile_id` no INSERT).
- **Exclusão de categoria em uso**: não mudei o schema (`ON DELETE CASCADE`/`SET NULL` nas FKs
  de `transactions.category_id`/`budgets.category_id` seria uma decisão de produto maior, fora
  do pedido desta fase). A UI trata o erro de FK com uma mensagem amigável em vez de deixar o
  usuário ver um erro genérico do Postgres.

### Confirmação de limpeza de dados de teste
Confirmado por duas vias independentes dentro do próprio script (rodadas no bloco `finally`,
garantindo que rodam mesmo se alguma asserção anterior falhasse): (1) as 3 exclusões
(transações → metas → categorias, na ordem que respeita as FKs) seguidas de `SELECT`; (2) uma
auditoria adicional por tag (`ILIKE '%[TESTE FASE3]%'`) nas 3 tabelas, sem depender dos IDs
específicos coletados durante o teste — as 3 retornaram 0 linhas. Nenhum dado de teste ficou na
base do usuário real (`rlamerico@gmail.com`). O script temporário (`e2e-fase3-tmp.mjs`, criado
na raiz do projeto só porque a resolução de módulos ESM do Node precisa do `node_modules` do
projeto por perto) foi apagado ao final — não sobrou no repositório.

### Pendências / próximos passos
- Commit ainda não feito (aguardando aprovação, conforme instrução) — mesma situação das
  Fases 1/2.
- **Usuário precisa validar no browser**: criar/editar/excluir categoria e meta pela UI;
  conferir que a tabela de Planejamento Mensal reflete corretamente transações lançadas na
  tela de Transações; testar o fluxo completo mês a mês (trocar seletor de mês/ano em Metas e
  em Planejamento).
- Ícones de categoria (ver "Desvios" acima) continuam só como texto, sem renderização visual —
  decisão de escopo, não bug.
- `npm audit`: mesma situação moderate/transitiva herdada das fases anteriores.
- Pronta pra Fase 4 (Investimentos) começar em cima deste trabalho: `typecheck`/`lint`/`test`/
  `build` 100% verdes, RLS e dados do usuário real limpos.

## Fase 4 — Investimentos (P06)

- [x] `supabase/migrations/005_investments_rls.sql` — policies de INSERT/UPDATE/DELETE para
      `investments` (gap encontrado no schema real: só existia SELECT, mesmo tipo de gap que a
      Fase 3 encontrou em `categories`/`budgets`)
- [x] `src/utils/validation/investment-schema.ts` (+ `.test.ts`) — zod: `asset_name` e
      `asset_type` obrigatórios (tipo é texto livre, com sugestões via `datalist`), `quantity`
      e `average_price` > 0, `current_price` opcional/nullable
- [x] `src/utils/portfolio-return.ts` (+ `.test.ts`) — `calculatePortfolioReturn()` pura: valor
      investido/atual/ganho/rentabilidade por ativo e agregados da carteira
- [x] `src/hooks/use-investments.ts` — `useInvestments(profileId)` + `useCreateInvestment`,
      `useUpdateInvestment`, `useDeleteInvestment`
- [x] `src/app/(app)/investimentos/page.tsx` + `src/components/investments/{investments-view,
      investment-form,investment-row}.tsx` — CRUD de investimentos + carteira consolidada
- [x] `src/components/layout/nav-items.ts` — `comingSoon: true` removido de P06

## Review (Fase 4)

**Concluído em 2026-06-30.**

### O que foi feito
- **Banco de dados**: migration `005_investments_rls.sql` aplicada via `supabase db push`
  (`supabase migration list` confirma `001`-`005` sincronizadas local↔remoto). Adiciona as
  policies de RLS que faltavam pra escrita em `investments` (INSERT/UPDATE/DELETE, mesmo padrão
  `auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)` de `transactions`/
  `budgets`) — o brief da fase já previa esse gap corretamente (achado real da Fase 1).
- **Lógica pura + testes**: `investment-schema.ts` (zod, mesmo padrão de `budget-schema.ts`) e
  `portfolio-return.ts` (`calculatePortfolioReturn` — calcula valor investido
  (`quantity * average_price`) sempre, mas só inclui um ativo no valor de mercado/rentabilidade
  agregada quando `current_price` está preenchido; ativo sem cotação fica com
  `currentValue`/`gain`/`returnPercentage` = `null`, nunca tratado como zero) — 14 testes novos
  (8 de `investment-schema`, 6 de `portfolio-return`), todos passando.
- **Hook**: `use-investments.ts` segue exatamente o padrão de `use-budgets.ts` — `useInvestments`
  sem Realtime (mudança só por ação direta do usuário), mutations invalidando
  `["investments", profileId]`. `useUpdateInvestment` também atualiza `last_updated` com o
  timestamp atual a cada edição.
- **UI**: `InvestmentsView` mostra 3 cards de resumo (valor investido, valor atual,
  rentabilidade agregada — mostrando "—"/"Sem cotação" quando nenhum ativo tem `current_price`
  em vez de 0%) + lista de ativos com rentabilidade individual + modal Radix `Dialog` de criar/
  editar (campo "Tipo" com `datalist` sugerindo "Renda Fixa"/"Renda Variável"/"Cripto" mas
  aceitando texto livre, campo "Preço atual" claramente marcado como opcional/manual).
- **Regra de ouro respeitada**: no `page.tsx` novo, o único dado que atravessa a fronteira
  Server → Client é `profileId` (string/UUID) — mesmo padrão de `categorias`/`planejamento`/
  `transacoes`/`dashboard`.

### Verificação
- `npm run typecheck` ✓ · `npm run lint` ✓ ("No issues found") · `npm test` ✓ (**62/62**, 10
  arquivos de teste — os 48 testes das Fases 1-3 continuam passando + 14 novos desta fase
  (8 de `investment-schema.test.ts` + 6 de `portfolio-return.test.ts`)).
- `npm run build` ✓ — sem erros de serialização RSC. Rota nova `/investimentos` dinâmica (`ƒ`),
  mesmo padrão de `/categorias`/`/planejamento`/`/transacoes`/`/dashboard`.
- Processo antigo na porta 3000 (sobrando de uma fase anterior) identificado via `lsof -i :3000`
  e finalizado antes de subir `npm run dev` em background. `curl` confirma `/investimentos`
  deslogado → **307** com redirect pra `/login` (junto com `/categorias` e `/` → 200,
  reconfirmando que o shell segue saudável).
- **Teste ponta-a-ponta real** (script Node com `@supabase/supabase-js`, mesma abordagem das
  Fases 1-3 — sem browser automation disponível — com todos os passos dentro de um
  `try/finally`): login com `rlamerico@gmail.com` → confirma perfil `role = admin` → cria 3
  investimentos de teste com tipos diferentes (Renda Fixa, Renda Variável sem cotação, Cripto)
  num único INSERT — **confirma que a policy de INSERT nova funciona** (sem ela o gap de RLS
  bloquearia silenciosamente, mesmo bug-classe que a Fase 3 preveniu em categories/budgets) →
  recalcula `calculatePortfolioReturn` manualmente com os dados reais devolvidos pelo Supabase e
  confere valor investido/atual/ganho/rentabilidade por ativo, inclusive o ativo sem cotação
  ficando fora do total de valor de mercado (não zerado) → testa UPDATE de `current_price` num
  dos ativos e confirma que o recálculo reflete a nova cotação → testa DELETE de 1 investimento
  e confirma que ele some do SELECT → **limpa os 2 investimentos restantes no `finally`** →
  auditoria independente por tag (`ILIKE '%[TESTE FASE4]%'`) confirma 0 registros restantes.
  27 asserções, todas passaram (`TUDO OK`). Base do usuário real ficou limpa.

### Desvios em relação ao plano
- Nenhum desvio de escopo: o brief já sinalizava corretamente o gap de RLS de `investments`
  (só SELECT existia) e a decisão de preço atual manual (sem integração de cotação), então a
  implementação seguiu o plano à risca, sem achados novos que exigissem ajuste de rota.
- `currentValue`/`totalCurrentValue` da carteira retornam `0` (não `null`) quando **nenhum**
  ativo tem cotação — a UI (`InvestmentsView`) trata esse caso separadamente checando
  `totalReturnPercentage !== null` antes de exibir o valor, mostrando "—" em vez de "R$ 0,00"
  pra não sugerir que a carteira vale zero. Documentando aqui porque não é um teste automatizado
  de UI, só o cálculo puro (`portfolio-return.test.ts`) mais a leitura do componente confirmam
  esse comportamento.

### Confirmação de limpeza de dados de teste
Confirmado por duas vias independentes dentro do próprio script (rodadas no bloco `finally`,
garantindo que rodam mesmo se alguma asserção anterior falhasse): (1) exclusão dos 2
investimentos restantes por ID, seguida de `SELECT` confirmando 0 linhas para o registro
excluído individualmente durante o teste; (2) uma auditoria adicional por tag
(`ILIKE '%[TESTE FASE4]%'`), sem depender dos IDs específicos coletados durante o teste —
retornou 0 linhas. Nenhum dado de teste ficou na base do usuário real (`rlamerico@gmail.com`).
O script temporário (`e2e-fase4-tmp.mjs`, criado na raiz do projeto pelo mesmo motivo da Fase 3
— resolução de módulos ESM do Node precisa do `node_modules` do projeto por perto) foi apagado
ao final — não sobrou no repositório (`git status` confirma).

### Pendências / próximos passos
- Commit ainda não feito (aguardando aprovação, conforme instrução) — mesma situação das
  Fases 1-3.
- **Usuário precisa validar no browser**: criar/editar/excluir investimento pela UI; conferir
  que os cards de resumo e a rentabilidade por ativo fazem sentido visualmente; testar o campo
  "Preço atual" ficando em branco (estado "Sem cotação") e depois preenchido.
- **Cotação automática de ativos requer decisão do usuário sobre qual API de mercado usar (ex.:
  Brapi, CoinGecko) — não implementada, preço atual é editável manualmente.** Ver também o
  ponto equivalente já registrado no plano (`~/.claude/plans/idempotent-doodling-journal.md`).
- `npm audit`: mesma situação moderate/transitiva herdada das fases anteriores.
- Pronta pra Fase 5 (Relatórios) começar em cima deste trabalho: `typecheck`/`lint`/`test`/
  `build` 100% verdes, RLS e dados do usuário real limpos.

## Fase 5 — Relatórios (P07)

- [x] `recharts` instalado (`^3.9.1`, compatível com React 19 via peerDependencies) — única
      dependência nova desta fase
- [x] `src/utils/report-periods.ts` (+ `.test.ts`) — `getLastMonthPeriods()` pura: gera os
      últimos N períodos mês/ano em ordem cronológica, atravessando virada de ano corretamente
- [x] `src/utils/expenses-by-category.ts` (+ `.test.ts`) — `groupExpensesByCategory()` pura:
      agrupa despesas por categoria (receitas ignoradas, sem categoria vira "Sem categoria"),
      ordenado do maior pro menor gasto
- [x] `src/utils/monthly-planned-actual.ts` (+ `.test.ts`) — `aggregateMonthlyPlannedVsActual()`
      pura: Planejado × Realizado por mês, cruzando metas por período com transações reais
- [x] `src/utils/balance-evolution.ts` (+ `.test.ts`) — `calculateBalanceEvolution()` pura:
      saldo acumulado mês a mês a partir do líquido (receitas - despesas) de cada período
- [x] `src/utils/export.ts` (+ `.test.ts`) — `toCsv`/`toJson`/`downloadCsv`/`downloadJson`
      (Blob + link de download nativos, sem dependência nova); reutilizável pela Fase 9
- [x] `src/app/(app)/relatorios/page.tsx` + `src/components/reports/reports-view.tsx` — 3
      gráficos recharts (pizza de despesas por categoria com período selecionável, barras
      Planejado × Realizado dos últimos 6 meses, linha de evolução de saldo acumulado) +
      botões de exportação CSV/JSON
- [x] `src/app/(app)/relatorios/imprimir/page.tsx` — Server Component com tabelas HTML puras
      (sem recharts) pra impressão/"Salvar como PDF"
- [x] `print:hidden` em `Sidebar`/`Topbar`/`MobileBottomBar` + `print:p-0` no `<main>` do
      `AppLayout` — esconde a navegação ao imprimir qualquer página do app (não só
      `/relatorios/imprimir`), usando os utilitários `print:` nativos do Tailwind v4 em vez de
      CSS de impressão customizado
- [x] `src/components/layout/nav-items.ts` — `comingSoon: true` removido de P07

## Review (Fase 5)

**Concluído em 2026-06-30.**

### O que foi feito
- **Dependência nova**: `recharts@3.9.1` instalado via `npm install recharts` — peer
  dependencies confirmam suporte a React 19 (`^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0`). Sem
  migration nova (fase só de leitura, RLS de SELECT de `transactions`/`budgets`/`categories`
  já cobria as fases anteriores, nenhum gap novo encontrado).
- **Lógica pura + testes**: 5 novos módulos em `src/utils/` — `report-periods.ts` (janela de
  N meses cronológica, testado inclusive na virada de ano dez/jan), `expenses-by-category.ts`
  (pizza), `monthly-planned-actual.ts` (barras), `balance-evolution.ts` (linha, saldo
  acumulado) e `export.ts` (CSV/JSON genérico, reutilizável pela Fase 9) — 22 testes novos,
  todos passando.
- **Hooks**: nenhum hook novo criado, conforme instrução — `ReportsView` reusa `useCategories`,
  `useTransactions` (uma chamada filtrada pro período selecionável do gráfico de pizza, outra
  com `sinceDate` cobrindo a janela de 6 meses pros gráficos de barra/linha) e `useBudgets`.
  `useBudgets` não suporta intervalo de meses, então é chamado 6 vezes de forma **fixa e
  incondicional** (uma por período da janela, `MONTHS_WINDOW = 6` é uma constante literal) —
  respeita as Regras de Hooks (contagem e ordem sempre iguais) sem precisar de `useQueries` ou
  de criar um hook novo.
- **UI**: `ReportsView` (client) monta os 3 gráficos recharts inteiramente do lado client a
  partir de dados serializáveis vindos dos hooks — nenhuma config de gráfico atravessa a
  fronteira Server → Client, só `profileId` (regra de ouro respeitada, mesmo padrão de
  `investimentos/page.tsx`). Página `/relatorios/imprimir` é Server Component puro (tabelas
  HTML, sem JS de gráfico) que busca os mesmos dados direto do Supabase e roda as mesmas
  funções puras de agregação.
- **Impressão**: em vez de CSS `@media print` customizado, usei os utilitários `print:` do
  Tailwind v4 direto em `Sidebar`/`Topbar`/`MobileBottomBar` (`print:hidden`) e no `<main>` do
  `AppLayout` (`print:p-0 print:bg-white`) — mais simples que duplicar regras de impressão, e
  como efeito colateral qualquer página do app (não só `/relatorios/imprimir`) imprime sem a
  navegação, o que é desejável.
- **Export**: `toCsv`/`toJson` em `src/utils/export.ts` são funções puras testáveis
  (`toCsv.test.ts` cobre escaping de `;`/aspas/quebra de linha); `downloadCsv`/`downloadJson`
  encapsulam o `Blob`+link de download (não testados por unidade, são só I/O de browser).
  Botões na página de Relatórios exportam a quebra de despesas por categoria do período
  selecionado.

### Verificação
- `npm run typecheck` ✓ · `npm run lint` ✓ ("No issues found") · `npm test` ✓ (**84/84**, 15
  arquivos de teste — os 62 testes das Fases 1-4 continuam passando + 22 novos desta fase:
  3 de `report-periods`, 5 de `expenses-by-category`, 4 de `monthly-planned-actual`, 3 de
  `balance-evolution`, 7 de `export`).
- `npm run build` ✓ — sem erro de serialização RSC. Rotas novas `/relatorios` e
  `/relatorios/imprimir` dinâmicas (`ƒ`), mesmo padrão das fases anteriores.
- Processo antigo na porta 3000 finalizado antes de subir `npm run dev` em background. `curl`
  confirma `/relatorios` e `/relatorios/imprimir` deslogado → **307** (redirect pra `/login`);
  `/` → 200.
- **Teste ponta-a-ponta real**: como esta fase não tem processo Node/TS puro rodável direto
  (o script `.mjs` das fases anteriores não resolve imports relativos sem extensão do
  TypeScript via `node --experimental-strip-types`), o teste real foi escrito como um arquivo
  de teste Vitest temporário (`e2e-fase5-tmp.test.ts`, na raiz do projeto, rodado sozinho via
  `npx vitest run e2e-fase5-tmp.test.ts`) — isso reusa a resolução de módulos TS/alias `@/` já
  configurada em `vitest.config.ts` e importa as funções puras **reais** (não uma
  reimplementação) direto de `src/utils/*`, mantendo o mesmo rigor das fases anteriores (login
  real, dados reais, cleanup em `finally`, auditoria por tag independente dos IDs coletados).
  Login com `rlamerico@gmail.com` → confirma perfil `role = admin` → captura baseline do mês
  corrente (despesas por categoria, saldo líquido, realizado) antes de inserir qualquer dado →
  insere 4 transações de teste (`[TESTE FASE5]`) em 3 categorias de despesa diferentes + 1
  receita na mesma categoria de uma das despesas (pra confirmar que a receita é excluída do
  gráfico de pizza mas conta na evolução de saldo) → recalcula `groupExpensesByCategory`,
  `aggregateMonthlyPlannedVsActual` e `calculateBalanceEvolution` com os dados reais devolvidos
  pelo Supabase e confere que o **delta** (depois - antes) bate exatamente com os valores
  inseridos — usar delta em vez de total absoluto torna o teste correto mesmo que a conta real
  já tivesse outras transações no mês. 7 asserções, todas passaram. Limpeza no `finally`: apaga
  as 4 transações por ID, depois audita por `ILIKE '%[TESTE FASE5]%'` (independente dos IDs) —
  0 registros restantes, confirmado por uma segunda consulta manual fora do teste. Arquivo
  `e2e-fase5-tmp.test.ts` apagado ao final (`git status` confirma que não sobrou no repo).

### Desvios em relação ao plano
- Nenhum desvio de escopo. Um ajuste de método na verificação (explicado acima): troquei o
  script Node puro (`.mjs`) das fases anteriores por um teste Vitest temporário, porque desta
  vez o teste real precisava importar múltiplos módulos TS com imports relativos entre si
  (`report-periods.ts` importa `month-labels.ts`), e o loader nativo de TS do Node
  (`--experimental-strip-types`) não resolve imports sem extensão de arquivo — só faz type
  stripping, não resolução de módulo estilo bundler. Rodar como teste Vitest resolve isso sem
  precisar adicionar `tsx`/`ts-node` como dependência nova (fora do escopo aprovado pro plano,
  que só previa `recharts`). Zero impacto no rigor do teste: mesmo login real, mesmos dados
  reais, mesma limpeza/auditoria.

### Confirmação de limpeza de dados de teste
Confirmado por duas vias independentes: (1) a asserção final dentro do próprio teste Vitest
(bloco `finally`, roda mesmo se uma asserção anterior falhar) audita por
`ILIKE '%[TESTE FASE5]%'` e espera 0 linhas — passou; (2) uma consulta manual adicional feita
fora do teste, depois do teste já ter terminado e o arquivo temporário já apagado, repetiu a
mesma busca por tag e confirmou `leftover rows: []`. Nenhum dado de teste ficou na base do
usuário real (`rlamerico@gmail.com`). O arquivo temporário (`e2e-fase5-tmp.test.ts`) foi
apagado ao final — não sobrou no repositório.

### Pendências / próximos passos
- Commit ainda não feito (aguardando aprovação, conforme instrução) — mesma situação das
  Fases 1-4.
- **Usuário precisa validar no browser**: os 3 gráficos recharts (pizza/barras/linha) não têm
  como ser testados visualmente sem browser — a verificação desta fase cobriu só a lógica de
  dados por trás deles (funções puras) e a navegação (rotas 307/200). Testar também o seletor
  de mês/ano do gráfico de pizza, os botões de exportar CSV/JSON (conferir o arquivo baixado) e
  a página `/relatorios/imprimir` no preview de impressão do navegador (Cmd+P).
- `npm audit`: mesma situação moderate/transitiva herdada das fases anteriores (recharts não
  introduziu vulnerabilidade nova relevante — `npm audit` segue reportando as mesmas 2
  moderate transitivas de antes).
- Pronta pra Fase 6 (Painel n8n + Contas Bancárias) começar em cima deste trabalho:
  `typecheck`/`lint`/`test`/`build` 100% verdes, dados do usuário real limpos.

## Fase 6 — Painel n8n (P08) & Contas Bancárias (P09)

- [x] `supabase/migrations/006_bank_accounts.sql` — cria a tabela `bank_accounts`
      (gap de schema: PRD não previa contas bancárias) + RLS completa
      (SELECT/INSERT/UPDATE/DELETE por dono, mesmo padrão de `transactions`/
      `investments`)
- [x] `src/types/database.ts` regenerado via `supabase gen types typescript`
      (inclui `bank_accounts`)
- [x] `N8N_WEBHOOK_SECRET` gerado (`openssl rand -hex 32`) e adicionado ao
      `.env.local` real — `.env.example` mantém a entrada vazia
- [x] `src/services/supabase/service-role.ts` — client com a `service_role`
      key (`@supabase/supabase-js` puro, sem cookies), uso exclusivo em
      Route Handlers server-only
- [x] `src/utils/validation/webhook-payload-schema.ts` (+ `.test.ts`) — zod:
      `profile_id` (UUID), `description`, `amount` (com sinal, ≠ 0), `date`,
      `category_id`/`status` opcionais
- [x] `src/app/api/webhooks/n8n/route.ts` — Route Handler POST: valida
      `x-webhook-secret` via hash SHA-256 + `crypto.timingSafeEqual`
      (comparação segura contra timing attack), valida payload com zod,
      valida `profile_id` contra `profiles` antes de inserir, insere em
      `transactions` via `service_role`, sempre grava `integrations_log`
      (sucesso/erro/não autorizado) — 201/400/401/404 conforme o caso
- [x] `src/hooks/use-integration-logs.ts` — `useIntegrationLogs(profileId)`
      (React Query, sem Realtime)
- [x] `src/components/n8n/log-list.tsx` + `src/app/(app)/n8n/page.tsx`
      (admin-only, checagem de role no Server Component além do
      `nav-items.ts`) — lista de eventos com estado vazio tratado
- [x] `src/utils/validation/bank-account-schema.ts` (+ `.test.ts`) — zod:
      nome obrigatório, banco/tipo opcionais, saldo numérico (aceita
      negativo)
- [x] `src/hooks/use-bank-accounts.ts` — `useBankAccounts(profileId)` +
      `useCreateBankAccount`, `useUpdateBankAccount`, `useDeleteBankAccount`
- [x] `src/app/(app)/contas/page.tsx` + `src/components/bank-accounts/
      {bank-accounts-view,bank-account-form,bank-account-row}.tsx` — CRUD de
      contas bancárias + saldo total consolidado
- [x] `src/utils/format.ts` — `formatDateTime()` adicionada (usada na lista
      de eventos do painel n8n)
- [x] `src/components/layout/nav-items.ts` — `comingSoon: true` removido de
      P08 e P09

## Review (Fase 6)

**Concluído em 2026-06-30.**

### O que foi feito
- **Banco de dados**: migration `006_bank_accounts.sql` aplicada via
  `supabase db push` (`supabase migration list` confirma `001`-`006`
  sincronizadas local↔remoto). Tabela nova `bank_accounts` com RLS completa.
  **Desvio real encontrado ao aplicar**: `uuid_generate_v4()` (usada em todas
  as migrations anteriores) falhou no banco remoto com
  `function uuid_generate_v4() does not exist` — a extensão `uuid-ossp` da
  migration 001 não está no `search_path` do projeto. Troquei por
  `gen_random_uuid()` (nativo do Postgres 13+, sem depender de extensão) só
  na tabela nova, sem tocar nas migrations anteriores já aplicadas.
- **`service_role` isolado**: `src/services/supabase/service-role.ts` é um
  client novo e separado dos dois já existentes (`client.ts`/`server.ts`),
  usando `@supabase/supabase-js` puro (não `@supabase/ssr`, que pressupõe
  cookies de sessão) — importado só dentro do Route Handler do webhook,
  nunca em código client-side.
- **Webhook**: `x-webhook-secret` comparado via hash SHA-256 dos dois lados +
  `crypto.timingSafeEqual` (em vez de comparar os segredos direto, que
  lançaria exceção se os tamanhos fossem diferentes e ainda vazaria timing);
  `profile_id` do payload é validado contra `profiles` antes de qualquer
  INSERT em `transactions` (não confia no valor recebido, já que não há
  `auth.uid()` num contexto de `service_role`); todo evento gera um registro
  em `integrations_log` — sucesso, erro de validação/inserção, ou tentativa
  não autorizada — sempre com `payload` e `status` preenchidos.
- **Painel n8n**: `LogList` (client, React Query) lista os eventos mais
  recentes (próprios do perfil + globais `profile_id IS NULL`, mesma regra
  da policy de SELECT), com payload bruto formatado pra depuração e estado
  vazio tratado. Página `/n8n` restrita a `admin` com checagem de role no
  próprio Server Component (defesa em profundidade — `nav-items.ts` só
  esconde o link, não bloqueia acesso direto pela URL).
- **CRUD de contas bancárias**: mesmo padrão exato de `use-investments.ts`/
  `InvestmentsView` — card de saldo total consolidado + lista + modal Radix
  `Dialog` de criar/editar, saldo negativo destacado em vermelho.
- **Regra de ouro respeitada**: nos dois `page.tsx` novos, o único dado que
  atravessa a fronteira Server → Client é `profileId` (string/UUID) — mesmo
  padrão de todas as fases anteriores.

### Verificação
- `npm run typecheck` ✓ · `npm run lint` ✓ ("No issues found") · `npm test`
  ✓ (**100/100**, 17 arquivos de teste — os 84 testes das Fases 1-5
  continuam passando + 16 novos: 9 de `webhook-payload-schema.test.ts` + 7
  de `bank-account-schema.test.ts`).
- `npm run build` ✓ — sem erro de serialização RSC. Rotas novas `/contas` e
  `/n8n` dinâmicas (`ƒ`), `/api/webhooks/n8n` como Route Handler dinâmico,
  mesmo padrão das fases anteriores.
- Processo antigo na porta 3000 finalizado (`lsof -i :3000` + `kill -9`)
  antes de subir `npm run dev` em background. `curl` confirma `/n8n` e
  `/contas` deslogado → **307** com `location: /login`; `/` → 200.
- **Teste ponta-a-ponta real do webhook** (script Node temporário, service
  role + fetch direto contra `http://localhost:3000/api/webhooks/n8n`, todos
  os passos em `try/finally`): (1) **sucesso** — secret correto + payload
  válido → **201** com `id` da transação; confirma via SELECT que a
  transação foi inserida com `profile_id`/`amount`/`description` corretos e
  que um `integrations_log` com `status=success` foi criado com o payload;
  (2) **secret errado** → **401**; confirma `integrations_log` com
  `status=unauthorized` criado; (3) **payload inválido** (descrição ausente
  + `amount=0`) → **400**; confirma `integrations_log` com `status=error`
  criado com o payload bruto; (4) **bônus, não pedido explicitamente**:
  `profile_id` inexistente → **404**, também logado. 22 asserções no total
  (webhook + CRUD de contas), todas passaram.
- **Teste ponta-a-ponta real de contas bancárias** (mesmo script, client
  anon + login real `rlamerico@gmail.com`/RLS): cria conta de teste
  (saldo 1000) → confirma saldo inicial → edita saldo (1234,56) → confirma
  atualização → exclui → confirma que não existe mais via SELECT com
  `service_role`.
- **Limpeza confirmada por duas vias independentes** (bloco `finally`): (1)
  exclusão por ID de cada transação/log/conta criados durante o teste,
  todas confirmadas sem erro; (2) auditoria independente por tag
  (`ILIKE '%[TESTE FASE6]%'` em `transactions.description` e
  `bank_accounts.name`, busca por substring no `payload` serializado dos 20
  `integrations_log` mais recentes) — **0 registros restantes** nas 3
  fontes. Script temporário (`e2e-fase6-tmp.mjs`, raiz do projeto) apagado
  ao final — `git status` confirma que não sobrou no repositório.

### Desvios em relação ao plano
- **`uuid_generate_v4()` indisponível no banco remoto**: ver "Banco de
  dados" acima — troca pontual pra `gen_random_uuid()` só em
  `bank_accounts`, sem mexer nas tabelas/migrations já aplicadas
  (investigar/corrigir o `search_path` da extensão `uuid-ossp` está fora do
  escopo desta fase e não bloqueia nada).
- **`formatDateTime()` nova em `src/utils/format.ts`**: o brief não pedia
  explicitamente, mas a lista de eventos do painel n8n precisa mostrar
  data+hora (não só data) do `executed_at` — adicionar ao módulo de formato
  já existente é mais simples e consistente do que criar um formatter local
  isolado só no `LogList`.
- **Teste bônus do cenário 404** (`profile_id` inexistente): não estava na
  lista explícita de cenários pedidos ("sucesso/secret errado/payload
  inválido"), mas como o código já implementa essa validação (item 4 do
  brief), testá-la também custou pouco e aumenta a confiança de que a
  validação contra `profiles` de fato funciona antes do INSERT.

### Confirmação de limpeza de dados de teste
Confirmado por duas vias independentes dentro do próprio script (bloco
`finally`, roda mesmo se uma asserção anterior falhar): (1) exclusão
individual por ID de tudo que foi criado (1 transação, 4 logs de
integração, 1 conta bancária — a conta já tinha sido excluída durante o
próprio teste de CRUD, então o `finally` não repetiu); (2) auditoria
independente por tag, sem depender dos IDs coletados durante o teste —
`transactions`/`bank_accounts` via `ILIKE '%[TESTE FASE6]%'` e
`integrations_log` via busca de substring no payload serializado dos 20
registros mais recentes — as 3 fontes retornaram **0 registros**. Nenhum
dado de teste ficou na base do usuário real (`rlamerico@gmail.com`).

### Pendências / próximos passos
- Commit ainda não feito (aguardando aprovação, conforme instrução) — mesma
  situação das Fases 1-5.
- **Usuário precisa validar no browser**: criar/editar/excluir conta
  bancária pela UI; conferir o card de saldo total (inclusive com saldo
  negativo); acessar `/n8n` logado como admin e como usuário não-admin
  (deve redirecionar pra `/dashboard`); disparar o webhook de verdade via
  `curl`/Postman e ver o evento aparecer na lista sem reload manual (o hook
  não tem Realtime nesta fase — precisa de reload/refetch).
- **Sincronização bancária real via n8n/Open Finance está fora do MVP** (já
  documentado no `CLAUDE.md`: "React Native mobile and real Open Finance
  integration are deferred to post-MVP"). Este webhook é só o **lado
  receptor** — o usuário precisa configurar um workflow n8n real apontando
  pra `/api/webhooks/n8n` (header `x-webhook-secret` com o valor gerado
  nesta fase) quando tiver um ambiente n8n disponível. Não é uma decisão de
  bloqueio, é um follow-up futuro de configuração externa.
- `npm audit`: mesma situação moderate/transitiva herdada das fases
  anteriores (nenhuma dependência nova nesta fase).
- Pronta pra Fase 7 (Calendário de Contas) começar em cima deste trabalho:
  `typecheck`/`lint`/`test`/`build` 100% verdes, RLS e dados do usuário
  real limpos.

## Fase 7 — Calendário de Contas (P10)

- [x] `src/utils/calendar-grid.ts` (+ `.test.ts`) — já existiam de uma
      tentativa anterior desta fase, revisados e reaproveitados sem
      alteração: função pura `buildCalendarGrid(month, year, transactions,
      today?)` monta o grid de semanas × dias, agrupa transações por data e
      marca dias fora do mês / dia atual
- [x] `src/hooks/use-transactions.ts` — `TransactionFilters` ganhou
      `status?: string`, aplicado como `.eq("status", filters.status)` na
      query; parâmetro opcional, retrocompatível com todo uso existente
      (Dashboard, Transações)
- [x] `src/app/(app)/calendario/page.tsx` — Server Component fino (mesmo
      padrão de `contas/page.tsx`), resolve `profiles.id` e passa só a
      string pro Client Component
- [x] `src/components/calendar/calendar-view.tsx` — grid de mês em CSS
      Grid/Tailwind, navegação mês anterior/próximo (estado local),
      `useTransactions(profileId, { month, year, status: "pending" }, 200)`
      mapeado pro formato `CalendarTransaction` e passado pra
      `buildCalendarGrid`; dia de hoje com `bg-primary/10` + label em
      destaque, dias fora do mês com `text-muted/40`, transações coloridas
      `text-success`/`text-error` conforme o sinal do valor
- [x] `src/components/layout/nav-items.ts` — `comingSoon: true` removido de
      P10

## Review (Fase 7)

**Concluído em 2026-06-30.**

### O que foi feito
- **Retomada de trabalho travado**: a primeira tentativa desta fase travou
  (stream watchdog, sem progresso por 600s) depois de criar só
  `calendar-grid.ts`/`calendar-grid.test.ts`. Este processo retomou a
  partir desses dois arquivos (revisados e aprovados, sem alteração) em vez
  de recomeçar do zero.
- **`useTransactions` ganhou filtro por `status`**: `TransactionFilters`
  agora aceita `status?: string`, aplicado via `.eq("status",
  filters.status)` — só executa se o filtro for passado, então todo
  consumidor existente (`DashboardContent`, `TransactionsView`) continua
  funcionando exatamente igual, sem esse filtro.
- **`CalendarView`**: usa `useTransactions(profileId, { month, year, status:
  "pending" }, 200)` — page size 200 (bem acima do default 20) porque o
  calendário precisa do conjunto completo de contas pendentes do mês numa
  página só (não usa "carregar mais" como a lista de Transações). Estado
  local de mês/ano com navegação anterior/próximo trata virada de
  ano/dezembro-janeiro nativamente. Grid renderizado com `buildCalendarGrid`
  já existente, sem tocar na função pura.
- **Regra de ouro respeitada**: o único dado que atravessa a fronteira
  Server → Client em `calendario/page.tsx` é `profileId` (string).

### Verificação
- `npm run typecheck` ✓ (sem erros) · `npm run lint` ✓ ("No issues found")
  · `npm test` ✓ (**107/107 passando**, 18 arquivos de teste — os 100
  testes das Fases 1-6 continuam passando, incluindo os 7 já existentes de
  `calendar-grid.test.ts`, que foram rodados isoladamente primeiro
  (`npm test -- calendar-grid`) antes de continuar, conforme instruído).
- `npm run build` ✓ — sem erro de serialização RSC. Rota nova `/calendario`
  aparece como dinâmica (`ƒ`) ao lado das demais páginas protegidas.
- Processo antigo na porta 3000 finalizado (`lsof -i :3000` + `kill -9`)
  antes de subir `npm run dev` em background. `curl` confirma `/calendario`
  deslogado → **307** com `location: /login`; `/` → 200.
- **Teste ponta-a-ponta real** (script `tsx` temporário, `@supabase/
  supabase-js`, todos os passos em `try/finally`): login real
  (`rlamerico@gmail.com`/RLS) → insere 3 transações de teste
  `status=pending` em junho/2026 (2 no dia 05, 1 no dia 20) → busca via a
  mesma query que o hook usa (`month`/`year`/`status=pending`) → roda
  `buildCalendarGrid` (a função pura de verdade, importada via
  `pathToFileURL` + `tsx`, não uma reimplementação) sobre os dados reais
  retornados pelo Supabase → confirma que o dia 05/06 agrupa as 2
  transações de despesa, o dia 20/06 agrupa a 1 transação de receita com o
  valor certo, nenhuma vazou pra outro dia, e `isToday` marca o dia de
  referência (30/06) corretamente. **11 asserções, todas passaram.**

### Desvios em relação ao plano
- **Fase retomada após travamento**: mencionado acima — nenhum código da
  tentativa anterior precisou ser descartado, só revisado e reaproveitado.
- **`status` como parâmetro genérico em vez de enum fixo**: o plano não
  detalhava o tipo; usei `string` (mesmo tipo da coluna no banco,
  `status: string | null`) em vez de um union type `"pending" | "paid" |
  ...` porque a coluna não tem `CHECK` constraint nem enum no schema atual
  — travar o tipo no frontend criaria uma falsa sensação de exaustividade.
- **Page size 200 no `useTransactions` do calendário**: não estava no
  plano, mas é necessário — o hook usa `useInfiniteQuery` com paginação
  "carregar mais" (page size default 20), e o calendário precisa do mês
  inteiro de uma vez, não paginado.
- **Sem arquivo de teste novo para `CalendarView`/`useTransactions`**:
  seguindo o padrão já estabelecido nas Fases 1-6 (nenhum hook ou
  componente client tem teste unitário no projeto — só utils puros, schemas
  de validação, e `nav-items.ts` têm `.test.ts`), a verificação de
  comportamento real ficou a cargo do teste ponta-a-ponta com dados reais
  do Supabase, não de um mock.

### Confirmação de limpeza de dados de teste
Confirmado por duas vias independentes dentro do próprio script (bloco
`finally`, roda mesmo se uma asserção anterior falhar): (1) exclusão
individual por ID das 3 transações criadas — todas confirmadas sem erro;
(2) auditoria independente por tag (`ILIKE '%[TESTE FASE7]%'` em
`transactions.description`, via `service_role`, sem depender dos IDs
coletados durante o teste) — **0 registros restantes**. Nenhum dado de
teste ficou na base do usuário real (`rlamerico@gmail.com`). Script
temporário (`e2e-fase7-tmp.mts`, raiz do projeto) apagado ao final —
`git status` confirma que não sobrou no repositório.

### Pendências / próximos passos
- Commit ainda não feito (aguardando aprovação, conforme instrução) — mesma
  situação das Fases 1-6.
- **Usuário precisa validar no browser**: navegar entre meses, conferir que
  contas pendentes aparecem no dia certo, que hoje (30/06/2026) está
  destacado, e que dias fora do mês corrente aparecem visualmente apagados.
- `npm audit`: mesma situação moderate/transitiva herdada das fases
  anteriores (nenhuma dependência nova nesta fase — `tsx` foi usado só via
  `npx` pro script de verificação, não entrou no `package.json`).
- **Servidor de dev deixado rodando em background na porta 3000** (não foi
  pedido explicitamente pra derrubar ao final) — outro processo pode
  reaproveitá-lo ou finalizá-lo (`lsof -i :3000` + `kill`).
- Pronta pra Fase 8 (Perfil + Configurações + RBAC) começar em cima deste
  trabalho: `typecheck`/`lint`/`test`/`build` 100% verdes, RLS e dados do
  usuário real limpos, nenhum arquivo temporário restante no repositório.

## Fase 8 — Perfil (P11) & Configurações de Sistema (P12) & RBAC fino

- [x] `supabase/migrations/007_admin_rbac_avatars.sql` — função
      `is_admin()` `SECURITY DEFINER` (padrão oficial anti-recursão) +
      policies `"Admins can view all profiles"`/`"Admins can update any
      profile"` em `profiles`; bucket `avatars` (público) + 4 policies de
      `storage.objects` restringindo escrita ao path `{user_id}/*`; trigger
      `BEFORE UPDATE ON profiles` (`enforce_role_change_admin_only`) que
      bloqueia mudança de `role` por quem não é admin — achado de segurança
      real corrigido nesta fase (ver Review)
- [x] `src/utils/validation/profile-schema.ts` (+ `.test.ts`) —
      `profileSchema` (`full_name`), `avatarFileSchema` (tipo/tamanho do
      arquivo, máx 5MB PNG/JPEG/WebP), `ROLE_OPTIONS`
- [x] `src/hooks/use-profile.ts` — `useProfile`, `useUpdateProfile`,
      `useUploadAvatar` (upload com `upsert: true` + cache-busting na URL
      pública)
- [x] `src/hooks/use-admin-profiles.ts` — `useAdminProfiles` (lista todos os
      `profiles`, admin-only via RLS), `useUpdateProfileRole`
- [x] `src/app/(app)/perfil/page.tsx` + `src/components/perfil/perfil-view.tsx`
      — Server Component fino (mesmo padrão de `contas/page.tsx`) passa
      `profileId`/`userId` (strings); Client Component dividido em
      `PerfilView` (resolve o loading) + `PerfilForm` (`key`ado por
      `profile.id`, estado inicializado direto do dado carregado — evita
      `useEffect` de sincronização, que o lint `react-hooks/set-state-in-effect`
      rejeitou na primeira versão)
- [x] `src/app/(app)/configuracoes/page.tsx` + `src/components/configuracoes/configuracoes-view.tsx`
      — admin-only com checagem de `role` no próprio Server Component
      (defesa em profundidade, mesmo padrão de `n8n/page.tsx`); status do
      n8n (`Boolean(process.env.N8N_WEBHOOK_SECRET)`) calculado e renderizado
      só no servidor, nunca exposto ao client; tabela de usuários com
      dropdown de role (desabilitado pra o próprio admin, pra evitar
      autodemote acidental sem outro admin pra reverter)
- [x] `src/components/layout/nav-items.ts` — `comingSoon: true` removido de
      P11 e P12

## Review (Fase 8)

**Concluído em 2026-07-01.**

### Achado de segurança real (corrigido nesta fase)
A policy de dono em `profiles` (migration 002, `USING (auth.uid() =
user_id)`) nunca restringiu **quais** colunas um usuário pode alterar na
própria linha — sem uma `WITH CHECK` dedicada, um usuário comum autenticado
podia rodar `update profiles set role = 'admin' where user_id = auth.uid()`
e se auto-promover a admin, contornando toda a tela de Configurações.
Confirmado como exploração real via o teste de RBAC (item abaixo) antes da
correção. Corrigido com uma migration adicional: trigger `BEFORE UPDATE ON
profiles` (`enforce_role_change_admin_only`) que levanta uma exceção
(`errcode 42501`) sempre que `NEW.role IS DISTINCT FROM OLD.role` e quem
executa o UPDATE não é admin (`is_admin()` falso) — outros campos
(`full_name`, `avatar_url`) continuam livres pro dono editar. Este trigger
roda pra QUALQUER UPDATE na tabela (inclusive o do próprio admin
alterando outra linha, mas nesse caso `is_admin()` é verdadeiro e o UPDATE
passa normalmente).

### Teste de RBAC real (item 4 do prompt) — 19/19 asserções passaram
Script temporário `e2e-fase8-tmp.mts` (raiz do projeto, `tsx`,
`@supabase/supabase-js`), todo o fluxo dentro de um único `try/finally`:
- **(a)** criou um segundo usuário real (`teste-fase8-rbac@example.com`) via
  `serviceClient.auth.admin.createUser` — nasceu com `role: 'user'`
  automaticamente (trigger `handle_new_user`, confirma que só o primeiro
  usuário do sistema vira admin).
- **(b)** login real como admin (`rlamerico@gmail.com`): confirmado SELECT
  em todos os 2 profiles do sistema (policy `"Admins can view all
  profiles"`) e UPDATE bem-sucedido no `role` do usuário de teste, de
  `user` pra `viewer` (policy `"Admins can update any profile"`).
- **(c)** login real como o usuário de teste (não-admin, `role: viewer`):
  confirmado que a tentativa de auto-promoção (`update ... set role =
  'admin' where id = próprio id`) **falha com erro** (trigger bloqueando,
  não é um no-op silencioso) e que o `role` continua `viewer` depois;
  confirmado que `full_name` da própria linha continua editável
  livremente; confirmado que a tentativa de alterar o `role` do PRÓPRIO
  ADMIN (linha de outro usuário) resulta em **0 linhas afetadas** (RLS
  bloqueando via `USING`, nem chega a errar — só não encontra linha
  elegível pro UPDATE).
- **(d)** upload de avatar de teste (PNG 1×1 real) no path
  `{user_id}/avatar.png`, confirmado que a URL pública retorna HTTP 200
  sem autenticação (bucket público), depois removido do storage pelo
  próprio usuário de teste (policy `"Users can delete own avatar"`).
- **(e)** limpeza final, confirmada por 3 vias independentes dentro do
  `finally`: profile do usuário de teste deletado (`service_role`),
  `auth.users` do usuário de teste deletado via
  `serviceClient.auth.admin.deleteUser` — auditoria posterior com
  `auth.admin.listUsers()` confirma que **só resta 1 usuário no sistema**
  (`rlamerico@gmail.com`) e uma segunda auditoria via SELECT em `profiles`
  confirma **só resta 1 profile, `role: 'admin'`** — igual ao estado
  inicial checado no começo do próprio script. Script apagado ao final
  (`rm` + `git status` confirmou que não sobrou no repositório).

### Verificação
- `npm run typecheck` ✓ (sem erros) · `npm run lint` ✓ (achou 1 erro real
  na primeira passada — `react-hooks/set-state-in-effect` em
  `perfil-view.tsx` por sincronizar `fullName` via `useEffect`; corrigido
  dividindo em `PerfilView`/`PerfilForm` com estado inicializado direto do
  dado já carregado, `key`ado por `profile.id` — sem mais warnings) ·
  `npm test` ✓ (**116/116 passando**, 19 arquivos — os 107 testes das
  Fases 1-7 continuam passando + 9 novos de `profile-schema.test.ts`).
- `npm run build` ✓ — sem erro de serialização RSC. `/perfil` e
  `/configuracoes` aparecem como dinâmicas (`ƒ`) ao lado das demais.
- Processo antigo na porta 3000 finalizado (`lsof -i :3000` + `kill -9`)
  antes de subir `npm run dev` em background. `curl` confirma `/perfil` e
  `/configuracoes` deslogado → **307** pra `/login`; `/` → 200.
- Migration `007_admin_rbac_avatars.sql` aplicada via `supabase db push`
  (confirmada em `supabase migration list`: `007` local e remoto
  batendo). `supabase db advisors --linked --type security` rodado depois
  — 2 avisos **WARN** novos (nenhum ERROR/CRITICAL), ambos inerentes ao
  padrão exato mandado pelas instruções da fase, não desvios: (1)
  `public_bucket_allows_listing` no bucket `avatars` — a policy de SELECT
  pública (exigida pra exibir a foto sem assinar URL) também permite
  listar arquivos do bucket, trade-off documentado do próprio padrão
  oficial de bucket público de avatar; (2)
  `authenticated_security_definer_function_executable` em `is_admin()` —
  inerente a qualquer função `SECURITY DEFINER` chamada de dentro de uma
  RLS policy pra usuários `authenticated` (o `GRANT EXECUTE ... TO
  authenticated` é obrigatório pra a policy funcionar); a função só expõe
  se o CHAMADOR é admin, nenhum dado sensível de terceiros. Os outros 2
  avisos do relatório (`rls_auto_enable()`, senha vazada) já existiam
  antes desta fase, não relacionados às mudanças daqui.

### Desvios em relação ao plano
- **Trigger de bloqueio de auto-promoção**: não estava no texto original
  do arquivo de plano (`idempotent-doodling-journal.md`), mas estava
  explicitamente pedido no prompt desta fase como correção de segurança
  obrigatória — implementado e testado (ver achado de segurança acima).
- **`PerfilView` dividido em dois componentes**: não estava no plano;
  necessário pra resolver o erro real do lint `set-state-in-effect` sem
  recorrer a um `useEffect` de sincronização.
- **Select de role desabilitado pra o próprio admin** em
  `configuracoes-view.tsx`: não estava pedido explicitamente, mas evita um
  admin se auto-rebaixar sem querer e ficar sem acesso a Configurações
  (não há UI de "promover outro usuário a admin de emergência" nesta
  fase) — mudança pequena, mesma linha do resto da tela.
- **Cache-busting na URL do avatar** (`?updated=timestamp`): não estava no
  plano; necessário porque `upsert: true` mantém o mesmo path entre
  uploads, e a URL pública do Storage é cacheada agressivamente pelo
  browser — sem isso, trocar a foto não atualizaria visualmente até um
  hard refresh.

### Confirmação de limpeza de dados de teste
Ver seção "Teste de RBAC real" acima — 3 auditorias independentes dentro
do próprio `finally` confirmam remoção completa do usuário de teste
(`auth.users` + `profiles` + avatar no `storage.objects`) e que o sistema
volta ao estado inicial exato (1 usuário, `rlamerico@gmail.com`, `role:
admin`). Script temporário (`e2e-fase8-tmp.mts`, raiz do projeto) apagado
ao final — `git status` confirma que não sobrou no repositório.

### Pendências / próximos passos
- Commit ainda não feito (aguardando aprovação, conforme instrução) — mesma
  situação das Fases 1-7.
- **Usuário precisa validar no browser**: trocar o próprio nome/foto em
  `/perfil`; em `/configuracoes`, conferir a tabela de usuários (só vai
  mostrar 1 linha até existirem outros usuários reais) e o badge de status
  do n8n.
- `npm audit`: mesma situação moderate/transitiva herdada das fases
  anteriores (nenhuma dependência nova nesta fase — `tsx` foi usado só via
  `npx` pro script de verificação, não entrou no `package.json`).
- **Servidor de dev deixado rodando em background na porta 3000** (não foi
  pedido explicitamente pra derrubar ao final) — outro processo pode
  reaproveitá-lo ou finalizá-lo (`lsof -i :3000` + `kill`).
- Pronta pra Fase 9 (Exportação de Dados) começar em cima deste trabalho:
  `typecheck`/`lint`/`test`/`build` 100% verdes, RLS/RBAC de admin
  corrigido e testado ponta-a-ponta, dados de teste limpos, nenhum arquivo
  temporário restante no repositório.

## Fase 9 — Exportação de Dados (módulo 9)

- [x] `src/utils/export.ts` generalizado (CSV/JSON da Fase 5 mantidos
      intactos, sem mudar assinatura) — adiciona `buildWorkbook` (função pura,
      monta `XLSX.WorkBook` a partir de `{ name, rows }[]`, sanitiza nome de
      aba pro limite do Excel), `exportToExcel(data, filename, sheetName?)`
      (dispara download de uma tabela em `.xlsx`) e
      `exportWorkbookToExcel(filename, sheets)` (múltiplas abas num único
      arquivo, usado pelo "Exportar tudo")
- [x] `src/utils/export.test.ts` — 6 testes novos pra `buildWorkbook`
      (abas vazias, ordem, round-trip via `sheet_to_json`, aba com 0 linhas,
      truncamento de nome >31 caracteres, remoção de caracteres inválidos)
- [x] Nova dependência `xlsx` (SheetJS) — instalada a partir do CDN oficial
      do próprio projeto (`cdn.sheetjs.com`), não do registro npm (ver
      "Desvios" abaixo)
- [x] `src/hooks/use-budgets.ts` — `useAllBudgets(profileId)` novo (busca
      todas as metas do perfil sem filtro de mês/ano; `useBudgets` original,
      usado pelo Planejamento Mensal, continua igual)
- [x] `src/components/configuracoes/export-section.tsx` — UI de export:
      Transações/Orçamentos/Categorias/Investimentos/Contas Bancárias, cada
      uma com botões JSON/CSV/Excel, mais "Exportar tudo" (um `.xlsx` com uma
      aba por tabela). Reusa `useTransactions`, `useAllBudgets`,
      `useCategories`, `useInvestments`, `useBankAccounts`
- [x] `src/app/(app)/configuracoes/page.tsx` — nova seção "Exportar meus
      dados" (dentro do bloco admin-only existente, mesmo padrão de RBAC de
      P12)

## Review (Fase 9)

**Concluído em 2026-07-01.**

### O que foi feito
- **`export.ts` reutilizado, não duplicado**: `toCsv`/`toJson`/`downloadCsv`/
  `downloadJson` (Fase 5) não mudaram de assinatura — `reports-view.tsx`
  continua chamando exatamente como antes. Só foram **adicionadas** 3
  funções novas de Excel no mesmo arquivo.
- **`xlsx` (SheetJS)**: instalado via
  `npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` — ver
  "Desvios" abaixo pro motivo. `package.json`/`package-lock.json` registram
  a URL do CDN em vez de um número de versão semver, que é a forma
  oficialmente documentada pelo próprio projeto SheetJS de instalar builds
  atuais (o pacote publicado em `npmjs.com/package/xlsx` parou na `0.18.5` e
  não recebe mais patches de segurança lá).
- **`buildWorkbook`**: função pura (sem `Blob`/`document`), isso que permite
  testar a estrutura do workbook gerado sem precisar simular um download
  binário real — mesma filosofia de `toCsv`/`toJson` (transformação separada
  do disparo do download).
- **`useAllBudgets`**: `useBudgets(profileId, month, year)` original só serve
  o Planejamento Mensal (um mês por vez) — pra "exportar meus dados" fazer
  sentido, o export de Orçamentos precisa do histórico inteiro, não só do
  mês corrente. Adicionado no mesmo arquivo `use-budgets.ts`, reaproveitando
  o tipo `Budget` e o padrão de invalidação por prefixo de query key
  (`["budgets", profileId, ...]`) já usado pelas mutations existentes.
- **`bank_accounts` incluída no export**: o plano falava só em
  transactions/budgets/categories/investments, mas `bank_accounts` (Fase 6)
  pertence ao mesmo usuário e já existe no schema — excluí-la de um recurso
  de "exportar meus dados" seria uma omissão arbitrária, não uma
  simplificação. Decisão documentada aqui conforme pedido.
- **Export ficou dentro do bloco admin-only de Configurações**: `/configuracoes`
  inteira já é restrita a `role: admin` (nav-items.ts e a própria página,
  PRD §2.1 — "usuário/visualizador não têm acesso a configurações
  críticas"). Considerei mover "Exportar meus dados" pra fora desse bloco
  (dado que exportar os PRÓPRIOS dados não é uma ação administrativa por
  natureza), mas isso exigiria alterar `nav-items.ts` (dar a `user`/`viewer`
  acesso a uma página que hoje nem aparece na navegação deles) — mudança de
  RBAC fora do escopo desta fase e não pedida. Mantive a exportação dentro
  do bloco admin-only, consistente com a arquitetura de P12 já estabelecida;
  como o único usuário real do sistema é `admin`, isso não bloqueia nada
  hoje, mas é uma limitação a revisar se `user`/`viewer` reais forem
  cadastrados no futuro.
- **Página de tamanho único pra Transações no export**
  (`EXPORT_TRANSACTIONS_PAGE_SIZE = 5000`): mesma técnica já usada em
  `reports-view.tsx` (`HISTORY_PAGE_SIZE = 1000`) — um `pageSize` generoso
  numa única página do `useInfiniteQuery`, em vez de paginar de verdade.
  Consistente com o padrão já estabelecido no projeto; documentado aqui como
  limitação conhecida (acima de ~5000 transações, o export atual não pegaria
  o restante — não é o caso real hoje, ver dados abaixo).

### Verificação
- `npm run typecheck` ✓ (sem erros).
- `npm run lint` ✓ (sem erros).
- `npm test` ✓ — **122/122 passando**, 19 arquivos (os 116 testes das
  Fases 1-8 continuam passando + 6 novos de `buildWorkbook` em
  `export.test.ts`).
- `npm run build` ✓ — sem erro de serialização RSC. `/configuracoes`
  aparece como dinâmica (`ƒ`), igual às demais.
- `npm audit`: **3 vulnerabilidades encontradas ao instalar `xlsx` da
  origem padrão do npm** (`npm install xlsx`, resolve pra `0.18.5`, a
  última publicada em `npmjs.com`) — 2 **HIGH**: prototype pollution
  (`GHSA-4r6h-8v6p-xvw6`, corrigida na `0.19.3`) e ReDoS
  (`GHSA-5pgg-2g8v-p4x9`, corrigida na `0.20.2`). Investigado conforme
  pedido: ambas as CVEs afetam o caminho de **leitura/parse** de arquivos
  `.xlsx` (`XLSX.read`), que este projeto **nunca usa** (só gera arquivos
  via `XLSX.utils.json_to_sheet`/`XLSX.writeFile`) — ou seja, mesmo a
  `0.18.5` não seria explorável no nosso uso real. Ainda assim, troquei a
  instalação pra `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` (CDN
  oficial do próprio SheetJS, com as correções aplicadas) — depois da troca,
  `npm audit` não reporta mais nada relacionado a `xlsx`. Restam só as
  **2 moderate** de `postcss` (via `next`), transitivas e herdadas das
  fases anteriores, sem relação com esta fase.
- Processo antigo na porta 3000 finalizado (`lsof -ti:3000` + `kill -9`)
  antes de subir `npm run dev` em background. `curl` confirma
  `/configuracoes` deslogado → **307** pra `/login`; `/` → **200**.
- **Teste ponta-a-ponta real** (`e2e-fase9-tmp.mjs`, rodado via
  `npx tsx`, login real com `rlamerico@gmail.com`/RLS, 100% read-only):
  login real → busca as 5 tabelas de verdade
  (transactions/budgets/categories/investments/bank_accounts) → roda
  `toCsv`/`toJson`/`buildWorkbook` sobre os dados reais → confere round-trip
  de cada transformação contra o `SELECT` original → gera um buffer `.xlsx`
  binário de verdade via `XLSX.write` (24112 bytes, 5 abas) → logout. Estado
  real do sistema no momento do teste: `transactions`/`budgets`/
  `investments`/`bank_accounts` com **0 registros** (dados de teste das
  fases anteriores já limpos, usuário ainda não começou a usar o app de
  verdade) e `categories` com **14 registros** (seed padrão) — o teste
  cobriu tanto o caso de dados reais não-vazios (categorias) quanto arrays
  vazios reais (as outras 4 tabelas), útil como confirmação de que o export
  não quebra com resultado vazio. Script apagado ao final
  (`rm e2e-fase9-tmp.mjs` + `git status` confirmou que não sobrou no
  repositório).

### Desvios em relação ao plano
- **`xlsx` instalado via CDN do SheetJS em vez de `npm install xlsx`**: ver
  "Verificação" acima — investigação de segurança obrigatória (item 6 do
  brief) encontrou 2 HIGH na versão do registro npm; a versão do CDN oficial
  corrige ambas. `package.json` registra a URL do tarball em vez de um
  número de versão semver.
- **`useAllBudgets` novo em `use-budgets.ts`**: o brief pedia reusar hooks
  existentes sem criar hooks novos de leitura, mas `useBudgets` original é
  estruturalmente incapaz de retornar "todas as metas" (exige `month`/`year`
  obrigatórios) — usar só ele exportaria apenas o mês corrente, uma omissão
  de dados real num recurso de "exportar meus dados". Adicionar uma
  variante mínima (mesma tabela, mesmo tipo, só sem o filtro de período) foi
  o jeito mais simples de corrigir isso sem duplicar lógica de fetch.
- **`bank_accounts` incluída no export**: plano mencionava só as 4 tabelas
  originais; decisão de incluir também `bank_accounts` documentada acima.
- **Export mantido dentro do bloco admin-only de Configurações**: decisão
  documentada acima (não é uma mudança de RBAC fora de escopo, é manter a
  arquitetura de P12 já estabelecida).

### Confirmação de dados
Nenhum dado foi criado, alterado ou apagado nesta fase — o teste E2E é
100% read-only (só `SELECT` + transformação em memória). Não havia nada
pra limpar. `git status` confirma que o único arquivo temporário criado
(`e2e-fase9-tmp.mjs`) foi removido do repositório.

### Pendências / próximos passos
- Commit ainda não feito (aguardando aprovação, conforme instrução) — mesma
  situação das Fases 1-8. **Esta é a última fase do roteiro** — o MVP
  inteiro (Fases 0-9, PRD P01-P12) está implementado e verificado, o
  repositório inteiro segue sem nenhum commit.
- **Usuário precisa validar no browser**: em `/configuracoes`, seção
  "Exportar meus dados" — baixar cada tabela nos 3 formatos e o "Exportar
  tudo", abrir os arquivos `.xlsx`/`.csv`/`.json` gerados pra confirmar que
  abrem corretamente (Excel/Google Sheets/editor de texto). Como o usuário
  real ainda não tem transações/orçamentos/investimentos/contas cadastrados,
  o teste visual mais informativo será com Categorias (14 registros reais)
  até que o usuário comece a lançar dados de verdade.
- `npm audit`: 2 moderate transitivas de `postcss`/`next`, pré-existentes,
  sem relação com esta fase (ver "Verificação" acima).
- **Servidor de dev deixado rodando em background na porta 3000** (não foi
  pedido explicitamente pra derrubar ao final) — outro processo pode
  reaproveitá-lo ou finalizá-lo (`lsof -i :3000` + `kill`).
