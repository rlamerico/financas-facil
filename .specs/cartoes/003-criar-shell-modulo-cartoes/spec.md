# [003] Criar shell do módulo de cartões

## Objetivo
Entregar a rota `/cartoes`, o item de navegação e o esqueleto de abas do módulo
de Faturas de Cartão de Crédito, para que as specs seguintes só precisem
plugar conteúdo.

## Contexto

O **Finanças Fácil** (Next.js 16 App Router + TypeScript + Tailwind v4 +
Supabase) tem hoje 11 páginas protegidas (P02–P12) sob o route group
`src/app/(app)/`. Este módulo acrescenta a **P13 — Faturas de Cartão**.

O módulo terá 4 abas, entregues por specs diferentes:
- **Resumo** (spec 008) — gasto de cada cartão no mês
- **Lançamentos** (spec 007) — todos os itens da fatura
- **Longo prazo** (spec 009) — evolução multi-cartão
- **Cartões** (spec 004) — cadastro dos plásticos

Esta spec entrega **só o shell**: rota, nav, abas e placeholders. Cada aba
renderiza um estado vazio ("Em construção") que as specs seguintes substituem.

### Convenções obrigatórias do projeto (siga à risca)

**Regra de ouro Server → Client:** a página é um Server Component **fino** que
resolve `profiles.id` e passa **só a string `profileId`** para o Client
Component. Nada de objeto de sessão, nada de client Supabase atravessando a
fronteira. Padrão exato em `src/app/(app)/contas/page.tsx`:

```tsx
const supabase = await createClient();               // @/services/supabase/server
const { data } = await supabase.auth.getClaims();
if (!data?.claims) redirect("/login");
const { data: profile } = await supabase
  .from("profiles").select("id").eq("user_id", data.claims.sub).single();
if (!profile) redirect("/login");
return <CardsView profileId={profile.id} />;
```

**Navegação:** `src/components/layout/nav-items.ts` exporta `NAV_ITEMS` com
`{ id, label, href, icon, roles, comingSoon? }`, `MOBILE_NAV_IDS` e
`getNavItemsForRole(role)`. Existe teste em `nav-items.test.ts` — mantenha-o
verde. Ícones vêm de `lucide-react`.

**Estilo:** Tailwind v4 com tokens semânticos já definidos em `globals.css`
(`bg-surface`, `border-border`, `text-muted`, `text-error`, `shadow-card`).
Não introduza cores hex novas. Valores monetários usam `tabular-nums` e
`formatCurrency` de `@/utils/format`.

## Stack
- **Linguagem**: TypeScript 5 (strict)
- **Framework**: Next.js 16 (App Router), React 19
- **Banco de dados**: Supabase (só para resolver `profiles.id` aqui)
- **Libs relevantes**: `lucide-react`, `radix-ui`, `tailwind-merge` (via `@/utils/cn`)
- **Variáveis de ambiente necessárias**: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (já em `.env.local`)

## Dependências
> Nenhuma spec bloqueia esta. Roda em paralelo com 001 e 002.
- Pré-condição verificável: `src/components/layout/nav-items.ts` e
  `src/app/(app)/contas/page.tsx` existem. Se não existirem, **pare**.

## O que implementar

### Arquivos a CRIAR
- `src/app/(app)/cartoes/page.tsx` — Server Component fino (P13)
- `src/components/cards/cards-view.tsx` — Client Component com as 4 abas
- `src/components/cards/cards-tabs.tsx` — controle de abas acessível
- `src/components/cards/empty-state.tsx` — estado vazio reutilizável do módulo

### Arquivos a MODIFICAR
- `src/components/layout/nav-items.ts` — acrescentar a entrada P13
- `src/components/layout/nav-items.test.ts` — cobrir a entrada nova

### Lógica principal

1. `page.tsx` resolve o `profileId` no servidor e renderiza `<CardsView profileId=... />`.
   `export const metadata = { title: "Faturas de Cartão" }`.
2. `CardsView` é `"use client"`, guarda a aba ativa em `useState` e a reflete na
   URL via `?aba=resumo|lancamentos|longo-prazo|cartoes` (`useRouter` +
   `useSearchParams`), para que a aba sobreviva ao refresh e possa ser linkada.
3. Aba inválida ou ausente cai em `resumo`.
4. Cada aba renderiza `<EmptyState />` com o texto de placeholder.
5. Entrada nova em `NAV_ITEMS`:

```ts
{
  id: "P13",
  label: "Faturas de Cartão",
  href: "/cartoes",
  icon: CreditCard,          // de lucide-react
  roles: ["admin", "user", "viewer"],
}
```

Insira **depois de P12** no array. **Não** mexa em `MOBILE_NAV_IDS` — a bottom
bar mobile tem 4 slots fixos (P02, P03, P04, P07) e trocar isso é decisão de
produto que não pertence a esta spec.

### Schema / Tipos

```typescript
export type CardsTab = "resumo" | "lancamentos" | "longo-prazo" | "cartoes";

export interface CardsViewProps {
  profileId: string;
}
```

## Critérios de Aceitação
- [ ] CA-01: `/cartoes` responde autenticado e redireciona para `/login` sem sessão.
- [ ] CA-02: "Faturas de Cartão" aparece na sidebar e no menu para os três papéis
      (`admin`, `user`, `viewer`).
- [ ] CA-03: as 4 abas trocam de conteúdo e a aba ativa aparece na URL
      (`/cartoes?aba=lancamentos`); recarregar a página mantém a aba.
- [ ] CA-04: `?aba=qualquer-coisa` cai em "resumo" sem quebrar.
- [ ] CA-05: `nav-items.test.ts` cobre P13 e `npm test` passa.
- [ ] CA-06: `npm run lint`, `npm run typecheck` e `npm run build` passam.

## Comandos de Validação
```bash
npm test -- nav-items
npm run lint && npm run typecheck && npm run build
npm run dev        # abrir http://localhost:3000/cartoes
```

## Notas de Implementação
- `useSearchParams` exige `<Suspense>` no App Router quando usado em página
  estática. Como a página é dinâmica (autenticada), normalmente não dá
  problema — mas se o `build` reclamar, envolva `CardsView` num `<Suspense>`
  em `page.tsx`. Não desabilite a renderização estática do app inteiro por isso.
- `EmptyState` deve ser genérico (props `title`, `description`, `action?`):
  as specs 004–009 vão reaproveitá-lo para "nenhuma fatura importada",
  "nenhum cartão cadastrado", etc.
- Não crie componentes de gráfico aqui. `recharts` entra nas specs 008/009.
