# [007] Criar hooks de dados do módulo Empresas

## Objetivo
Hooks React Query para listar/criar/editar/excluir empresas, clientes e recebimentos, e para guardar a empresa ativa.

## Contexto
Módulo Empresas do Finanças Fácil (Next.js App Router + Supabase + React Query). O padrão de hooks está em
`src/hooks/use-bank-accounts.ts` (e `use-investments.ts`, `use-budgets.ts`): `useQuery` com `queryKey` estável, funções `fetch*` que usam
`createClient()` de `@/services/supabase/client`, mutations que invalidam a query, tipos via `Tables<"...">` de `@/types/database`.
Sem Realtime nesta fase. As tabelas `companies`, `business_clients` e `business_receipts` já têm tipos em `src/types/database.ts`
(spec 002) e RLS no banco: o cliente fala direto com o Supabase, a segurança está nas policies. O perfil do usuário vem de `src/hooks/use-profile.ts`.
Validação de entrada usa os schemas da spec 004 antes de enviar ao banco.

## Stack
- **Linguagem**: TypeScript
- **Framework**: Next.js (client components) + `@tanstack/react-query`
- **Libs relevantes**: Supabase JS (`@supabase/ssr`), Zod, Vitest
- **Variáveis de ambiente necessárias**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (já existentes)

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `002-criar-schema-clientes-recebimentos` — tipos `database.ts` das 3 tabelas
- [ ] `004-criar-schemas-validacao-empresa` — schemas Zod de entrada

## O que implementar

### Arquivos a CRIAR
- `src/hooks/use-companies.ts` — `useCompanies(profileId)`, `useCreateCompany`, `useUpdateCompany`, `useDeleteCompany`
- `src/hooks/use-business-clients.ts` — `useBusinessClients(companyId)`, create/update/delete
- `src/hooks/use-business-receipts.ts` — `useBusinessReceipts(companyId, { month? })`, create/update/delete
- `src/hooks/use-active-company.ts` — empresa ativa (id) persistida em `localStorage` (try/catch), com fallback para a primeira empresa

### Lógica principal
1. Cada query só roda com o id presente (`enabled: Boolean(id)`); `queryKey` inclui o id (e o mês, nos recebimentos).
2. Recebimentos: filtro de mês por `gte/lt` em `received_on`, ordenado por `received_on desc`.
3. Mutations validam com o schema Zod correspondente, enviam ao Supabase, lançam o erro original em falha e invalidam a query da lista.
4. `useActiveCompany` nunca assume `window`/`localStorage` disponível (SSR/privado); retorna `{ activeCompanyId, setActiveCompanyId }`.
5. Sem `console.log`; erros sobem para a UI tratar.

### Schema / Tipos
```typescript
export type Company = Tables<"companies">
export type BusinessClient = Tables<"business_clients">
export type BusinessReceipt = Tables<"business_receipts">
```

## Critérios de Aceitação
- [ ] CA-01: os hooks existem com a mesma forma de `use-bank-accounts.ts`
- [ ] CA-02: mutations invalidam as queries certas; erro do Supabase é propagado
- [ ] CA-03: `useActiveCompany` funciona sem `localStorage` (não lança)
- [ ] CA-04: `npm run typecheck`, `npm run lint` e `npm test` passam

## Comandos de Validação
```bash
npm run typecheck && npm run lint && npm test
```

## Notas de Implementação
> Commit: `feat(business): add data hooks`. Se não houver teste viável para os hooks, cobrir ao menos a lógica pura extraída (ex.: montagem do intervalo do mês).
