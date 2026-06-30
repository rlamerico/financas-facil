# TODO — Finanças Fácil

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
