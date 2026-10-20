# Como executar — Finanças Fácil (Módulo Empresas)

## Ambiente (repo dentro do Google Drive — leia antes)
- Gerenciador de pacotes: **npm** (`pnpm` não está instalado).
- `node_modules` é um **symlink** para `~/.local/share/node-modules/financas-facil` (nunca instalar dentro da pasta do Drive).
- Proxy TLS corporativo: `npm config set cafile ~/.local/share/certs/macos-ca-bundle.pem`; o `npm run dev` já exporta `NODE_EXTRA_CA_CERTS` via `scripts/dev.sh`.
  Se rodar `next dev`/`next start` direto, exporte `NODE_EXTRA_CA_CERTS` antes.
- `.env.local` guarda só `NEXT_PUBLIC_*`. Segredos vêm do `.envrc`/direnv (nunca em arquivo versionado nem sincronizado).

## Comandos
```bash
npm run dev         # http://localhost:3000
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest run
npm test -- --coverage
npm run build
```

## Banco (Supabase)
- Migrations ficam em `supabase/migrations/NNN_nome.sql` (as do módulo: `010_companies.sql`, `011_business_clients_receipts.sql`).
- Specs **escrevem** o SQL; **aplicar** exige aprovação explícita do usuário e `cat supabase/.temp/project-ref` conferido (irreversível no ambiente errado).
- Toda tabela nova: `ENABLE ROW LEVEL SECURITY` no mesmo arquivo, antes de qualquer INSERT.

## Git
- Branch única do módulo: `feat/empresa-recebimentos`. Um commit atômico por spec, formato `type(scope): descrição`.
- **Nunca** `git push` sem aprovação. Nunca commitar `.env*`, `.envrc` ou segredos.

## Antes de dar uma task por concluída
`npm run typecheck && npm run lint && npm test` verdes (e `npm run build` nas specs de UI), todos os CAs da spec marcados.
