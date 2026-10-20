# [009] Cadastrar clientes da empresa (Brasil e exterior)

## Objetivo
Tela para cadastrar clientes PJ da empresa ativa, separados em Brasil (BRL) e Exterior (USD).

## Contexto
Módulo Empresas do Finanças Fácil (Next.js App Router, Tailwind v4, Radix UI, React Query). Já existem: shell do módulo com seletor de empresa e
abas (`src/components/business/business-shell.tsx`, spec 008), hooks `useBusinessClients*` e `useActiveCompany` (spec 007) e
`businessClientSchema` (spec 004). Padrão de tela: `src/components/bank-accounts/*` (view + form + row). Um cliente tem `origin`
(`domestic`/`foreign`), `country` (obrigatório se exterior), `document` (CNPJ ou ID estrangeiro) e `default_currency` (BRL/USD).
Recebimentos referenciam clientes com `ON DELETE RESTRICT`: não é possível excluir cliente com recebimentos.

## Stack
- **Linguagem**: TypeScript
- **Framework**: Next.js App Router, Tailwind v4, Radix UI
- **Libs relevantes**: React Query, Zod
- **Variáveis de ambiente necessárias**: nenhuma nova

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `008-cadastrar-empresa` — shell, seletor de empresa e navegação
- [ ] `007-criar-hooks-empresa` — hooks de clientes

## O que implementar

### Arquivos a CRIAR
- `src/app/(app)/empresa/clientes/page.tsx`
- `src/components/business/clients-view.tsx` — duas seções/abas "Brasil" e "Exterior" com contagem
- `src/components/business/client-form.tsx` — origem muda os campos: Brasil pede CNPJ (validado com `isValidCnpj`); Exterior pede país (ISO-2, lista de países comuns + digitação) e ID livre
- `src/components/business/client-row.tsx`

### Lógica principal
1. Sem empresa ativa → estado vazio do shell.
2. Selecionar origem ajusta `default_currency` (Brasil→BRL, Exterior→USD) e valida com `businessClientSchema`.
3. Editar e excluir; exclusão de cliente com recebimentos mostra erro amigável (violação de FK), sem quebrar a página.
4. Lista ordenada por nome; badge de moeda por cliente.
5. Acessibilidade e responsividade como nas demais telas.

## Critérios de Aceitação
- [ ] CA-01: criar cliente do Brasil (BRL) e do exterior (USD, com país) aparecem em seções separadas
- [ ] CA-02: cliente exterior sem país é bloqueado; CNPJ brasileiro inválido é bloqueado
- [ ] CA-03: excluir cliente com recebimentos exibe mensagem clara
- [ ] CA-04: `typecheck`, `lint`, `test`, `build` passam

## Comandos de Validação
```bash
npm run typecheck && npm run lint && npm test && npm run build
npm run dev   # conferir /empresa/clientes manualmente
```

## Notas de Implementação
> Commit: `feat(business): add clients UI`. Formulário novo → `ecc:security-reviewer`.
