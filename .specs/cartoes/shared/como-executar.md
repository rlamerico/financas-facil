# Como executar este projeto

Contexto mínimo para qualquer agente que for rodar uma spec do módulo de
Faturas de Cartão de Crédito.

## Projeto

**Finanças Fácil** — plataforma de gestão financeira 360° que substitui a
planilha "Finanças Familiares 2026". Next.js 16 (App Router) + TypeScript +
Tailwind v4 + Supabase (Auth, Postgres com RLS, Realtime, Storage), deploy na
Vercel. Automações ficam no n8n. **Não existe backend próprio**: o PostgREST do
Supabase é a API, e a segurança mora na RLS.

Fonte de verdade do produto: `prd/prd.md`. Convenções do repositório:
`CLAUDE.md` na raiz.

## Comandos

Gerenciador de pacotes: **npm** (`pnpm` não está instalado nesta máquina).

```bash
npm run dev         # dev server (Turbopack) -> http://localhost:3000
npm run build       # build de produção
npm start           # serve o build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run test:watch  # vitest watch
```

## Três armadilhas desta máquina (um checkout novo precisa das três)

**1. `node_modules` não pode morar na pasta do Google Drive.** A sincronização
do Drive torna a escrita de milhares de arquivos pequenos inviável — o
`npm install` nunca termina. Aqui `node_modules` é um **symlink** para o disco
local:

```bash
mkdir -p "$HOME/.local/share/node-modules/financas-facil"
ln -s "$HOME/.local/share/node-modules/financas-facil" node_modules
npm install
```

**2. Interceptação de TLS (`SELF_SIGNED_CERT_IN_CHAIN`).** Um proxy corporativo
injeta uma CA raiz. Aponte o npm para o bundle do sistema (**não** desabilite
`strict-ssl`):

```bash
security find-certificate -a -p /System/Library/Keychains/SystemRootCertificates.keychain >  ~/.local/share/certs/macos-ca-bundle.pem
security find-certificate -a -p /Library/Keychains/System.keychain                          >> ~/.local/share/certs/macos-ca-bundle.pem
npm config set cafile "$HOME/.local/share/certs/macos-ca-bundle.pem"
```

**3. A mesma interceptação quebra o `fetch` do Node, não só o npm.** O SDK do
Supabase chama `fetch()` de dentro do processo do Next (Server Actions, Route
Handlers, middleware) e o Node ignora o CA store do npm. Sem
`NODE_EXTRA_CA_CERTS`, a falha aparece no browser como um genérico
"Failed to fetch" em qualquer chamada ao Supabase. O `npm run dev` já resolve
isso via `scripts/dev.sh`. Se você rodar `next dev`/`next start` direto:

```bash
export NODE_EXTRA_CA_CERTS="$HOME/.local/share/certs/macos-ca-bundle.pem"
```

Na Vercel nada disso é necessário.

## Supabase

- Projeto: `fvbugayxfmkjfbfwvheb` (conta `rlamerico@gmail.com`, org "Financas Facil").
- **Não existe login global nesta máquina.** Cada projeto exporta
  `SUPABASE_ACCESS_TOKEN` via `direnv`, lendo de
  `~/.config/supabase-tokens/financas-facil` (fora do repo, `chmod 600`).
  Detalhes em `~/.claude/SUPABASE.md`.
- **Antes de qualquer `db push` ou `functions deploy`**, confirme onde você está:

```bash
cat supabase/.temp/project-ref     # esperado: fvbugayxfmkjfbfwvheb
```

- Toda tabela nova nasce com `ENABLE ROW LEVEL SECURITY` **na mesma migration**,
  antes de qualquer INSERT.
- Use `gen_random_uuid()`, **não** `uuid_generate_v4()`: a extensão `uuid-ossp`
  da migration 001 não está no `search_path` do projeto remoto (erro real já
  encontrado na migration 006).
- Este repositório fica dentro do Google Drive. `.env.local` guarda **só**
  variáveis `NEXT_PUBLIC_*`; qualquer segredo (service role, segredo de webhook)
  vem do `.envrc`. O `.gitignore` protege do git, não da sincronização do Drive.

## Regenerar tipos depois de uma migration

```bash
npx supabase gen types typescript --linked > src/types/database.ts
```

## Antes de dar uma spec por concluída

1. `npm run lint`
2. `npm run typecheck`
3. `npm test`
4. `npm run build`
5. Confira **cada** critério de aceitação da spec, um por um.

Nenhuma spec está pronta com um CA por verificar.

## Git

- Branch antes de qualquer mudança: `feat/`, `fix/` ou `chore/`.
- Commit: `tipo(escopo): descrição curta` — ex.: `feat(cartoes): importar fatura xlsx`.
- Commits atômicos, um por mudança lógica.
- **Nunca** `git push` sem aprovação explícita do usuário.
- Nunca comite `.env`, `.envrc` ou segredos.
