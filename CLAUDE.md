# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status: Phase 0 done (foundation scaffolded)

Next.js 15/16 (App Router) + TypeScript + Tailwind v4 is scaffolded with the design
tokens, optimized brand assets, Supabase client, folder structure, and a public
landing page. Data model / app pages are the next phases — see `tasks/todo.md`.

- `prd/prd.md` — **source of truth** for product scope, data model, and design. Read it before any implementation.
- `logo/logo.png` — original logo (5.1 MB). Optimized assets already generated in `public/`
  (`logo.png` ~99 KB, `favicon.ico`, `apple-touch-icon.png`, `icon-192/512.png`).

## What This Product Is

**Finanças Fácil** — a 360° financial management platform that replaces the manual "Finanças Familiares 2026" spreadsheet. It serves both individuals/families and small businesses (separate-but-integrated cash flows). Core value: **n8n automation** ingests bank statements/receipts and feeds real-time dashboards comparing **Planejado × Realizado** (Planned vs. Actual).

## Architecture (decided)

Three pieces — **we only build the frontend/server layer**; Supabase is a managed backend, n8n handles automations.

```
Next.js 15 (App Router)  →  Supabase (BaaS)  ←  n8n (automations)
  frontend + RSC + Route     Auth · Postgres+RLS    bank import,
  Handlers + landing/SEO      Realtime · Storage     notifications, backup
```

- **No hand-written REST API / backend server.** Supabase auto-generates the REST API (PostgREST); we write SQL (tables, RLS, triggers) and consume it via `@supabase/ssr`.
- **Security lives in the database via RLS**, not in middleware. Every table must have RLS enabled with policies keyed on `auth.uid()`. This is what makes it safe for the client to talk to Supabase directly.
- **Server-side secrets / sensitive logic** go in Next.js **Route Handlers** (e.g. the n8n webhook receiver) or **n8n** — never in client code or `NEXT_PUBLIC_*` vars.
- **Realtime**: when n8n inserts a transaction, Supabase Realtime pushes the change to update dashboards without refresh.

### Key decision: Next.js over Vite
The PRD originally specified **React + Vite (SPA)**. This was changed to **Next.js 15 (App Router)** to get a public marketing/landing page with SEO, SSR on the data-heavy dashboard, and server-side secret handling. Everything else in the PRD's stack stands.

## Stack

| Layer | Tech |
|---|---|
| Frontend/Server | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + Radix UI |
| State / Data | Zustand (global) + React Query (cache) + Server Components |
| Backend (BaaS) | Supabase — Auth, PostgreSQL + RLS, Realtime, Storage (receipts) |
| Automations | n8n (bank sync, WhatsApp/Telegram alerts, spreadsheet import, weekly backup) |
| Deploy | Vercel (Next.js) + Supabase Cloud |

## Data Model

Centered on `profiles` (links `auth.users` → role `admin`/`user`/`viewer`). Full SQL schema is in `prd/prd.md` §5.2. Core tables:

- `profiles` · `categories` (global or per-profile) · `transactions` · `budgets` (Planned vs Actual, unique per `profile_id+category_id+month+year`) · `investments` · `integrations_log`.
- **Always** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` in the same migration as `CREATE TABLE`, before any INSERT.

## Design System (from PRD §4)

- **Palette:** Primary `#2E7D32` (green), Secondary `#1565C0` (blue/investments), Success `#43A047`, Error `#D32F2F`, Background `#F5F5F5`.
- **Typography:** Inter (tabular numerals for financial columns). Titles Bold 700, body Regular 400.
- **Components:** Radix UI + Tailwind. Data tables (pagination/sort), summary cards with sparklines, quick-add transaction modals, fiscal-period date pickers.
- **Responsive:** Desktop sidebar + multi-column · Tablet retractable sidebar · Mobile bottom bar.

## Roles (RBAC — enforce via RLS)

- **admin** — full access: n8n config, bank accounts, categories, user management.
- **user** — log income/expenses, view dashboards, manage goals; no system config.
- **viewer** — read-only reports/dashboards (for accountants/partners).

## Scope Notes

The 12 pages (P01–P12) and 10 modules are enumerated in `prd/prd.md` §2.2–2.3. MVP scope is **Web only**; React Native mobile and real Open Finance integration are deferred to post-MVP.

## Commands

Package manager: **npm** (`pnpm` is not installed on this machine).

```bash
npm run dev         # local dev server (Turbopack) → http://localhost:3000
npm run build       # production build
npm start           # serve the production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run test:watch  # vitest (watch mode)
```

### Environment setup (IMPORTANT — this repo lives inside Google Drive)

Three machine-specific gotchas were hit during Phase 0/1; a fresh checkout needs all three:

1. **`node_modules` must NOT live in the Drive folder.** Google Drive's sync layer
   makes writing thousands of small files unbearably slow (`npm install` never
   finishes). `node_modules` here is a **symlink** to a local-disk dir:
   ```bash
   mkdir -p "$HOME/.local/share/node-modules/financas-facil"
   ln -s "$HOME/.local/share/node-modules/financas-facil" node_modules
   npm install
   ```
2. **TLS interception (`SELF_SIGNED_CERT_IN_CHAIN`).** A corporate proxy injects a
   root CA, so npm can't reach the registry. Point npm at the system CA bundle
   (do **not** disable strict-ssl):
   ```bash
   security find-certificate -a -p /System/Library/Keychains/SystemRootCertificates.keychain >  ~/.local/share/certs/macos-ca-bundle.pem
   security find-certificate -a -p /Library/Keychains/System.keychain                          >> ~/.local/share/certs/macos-ca-bundle.pem
   npm config set cafile "$HOME/.local/share/certs/macos-ca-bundle.pem"
   ```
3. **Same TLS interception breaks Node's runtime `fetch`, not just npm.** `npm config
   set cafile` only fixes `npm install`. The Supabase JS SDK calls `fetch()` from
   inside the Next.js server process (Server Actions, Route Handlers, middleware),
   and Node ignores the system/npm CA store — without `NODE_EXTRA_CA_CERTS` it fails
   with `SELF_SIGNED_CERT_IN_CHAIN`, which surfaces in the browser as a generic
   "Failed to fetch" on any Supabase call (e.g. signup/login). `npm run dev` already
   handles this via `scripts/dev.sh` (sets `NODE_EXTRA_CA_CERTS` if the bundle from
   gotcha #2 exists). If you ever run `next dev`/`next start` directly instead of
   through the npm scripts, export it yourself first:
   ```bash
   export NODE_EXTRA_CA_CERTS="$HOME/.local/share/certs/macos-ca-bundle.pem"
   ```
   Not needed on Vercel (no corporate proxy there), so `build`/`start` scripts are
   left untouched.

Copy `.env.example` → `.env.local` and fill the Supabase keys before running with real data.

## Source-of-truth Documents

- `prd/prd.md` — product requirements, SQL schema, design, n8n flows.
- `.claude/plans/` (when created) — implementation plans per phase.
