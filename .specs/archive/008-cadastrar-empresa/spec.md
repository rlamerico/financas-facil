# [008] Cadastrar empresa + navegação do módulo

## Objetivo
Tela para cadastrar/editar empresas (MEI ou Simples), seletor de empresa ativa e item "Empresa" na navegação.

## Contexto
Módulo Empresas do Finanças Fácil (Next.js App Router, Tailwind v4, Radix UI, React Query). Layout autenticado em `src/app/(app)/layout.tsx`;
páginas existentes como `src/app/(app)/contas/` (use-as como referência: página + view client + form + row). Componentes de referência:
`src/components/bank-accounts/{bank-accounts-view,bank-account-form,bank-account-row}.tsx`. Navegação em `src/components/layout/nav-items.tsx`
(sidebar e bottom bar mobile, filtrada por role). Design system: cards `rounded-lg + shadow-card`, modais com `shadow-overlay + animate-fade-up`,
dark mode via tokens `--tone-*`. As finanças pessoais ficam intocadas; empresa é uma área separada sob `/empresa`.
Hooks (spec 007) e schemas (spec 004) já existem.

## Stack
- **Linguagem**: TypeScript
- **Framework**: Next.js App Router, Tailwind v4, Radix UI
- **Libs relevantes**: React Query, Zod
- **Variáveis de ambiente necessárias**: nenhuma nova

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `007-criar-hooks-empresa` — dados e empresa ativa
- [ ] `004-criar-schemas-validacao-empresa` — validação do formulário

## O que implementar

### Arquivos a CRIAR
- `src/app/(app)/empresa/page.tsx` — rota `/empresa` (lista/cadastro de empresas)
- `src/components/business/companies-view.tsx`, `company-form.tsx`, `company-row.tsx`
- `src/components/business/company-switcher.tsx` — seletor da empresa ativa (usado nas telas `/empresa/*`)
- `src/components/business/business-shell.tsx` — cabeçalho comum com seletor + abas (Recebimentos, Clientes, Contabilidade); estado vazio "cadastre sua empresa"

### Arquivos a MODIFICAR
- `src/components/layout/nav-items.tsx` — novo item "Empresa" (`/empresa`), visível a admin e user; viewer apenas leitura se o padrão atual já o tratar

### Lógica principal
1. Formulário: razão social, nome fantasia, CNPJ com máscara visual (salvar só dígitos), regime (MEI / Simples Nacional / Outro). Validar com `companySchema`.
2. CNPJ duplicado do mesmo usuário → mensagem amigável (violação da unique).
3. Sem empresa cadastrada, as demais abas mostram estado vazio levando ao cadastro.
4. Excluir empresa exige confirmação e avisa que apaga clientes e recebimentos (cascade).
5. Acessível: labels, foco, mensagens de erro associadas aos campos; responsivo (tabela vira lista no mobile).

## Critérios de Aceitação
- [ ] CA-01: usuário cria, edita e exclui uma empresa; CNPJ inválido é bloqueado com mensagem em português
- [ ] CA-02: item "Empresa" aparece na sidebar e na bottom bar; item ativo destacado em `/empresa/*`
- [ ] CA-03: seletor muda a empresa ativa e persiste ao recarregar
- [ ] CA-04: visual consistente em claro/escuro e mobile
- [ ] CA-05: `typecheck`, `lint`, `test`, `build` passam

## Comandos de Validação
```bash
npm run typecheck && npm run lint && npm test && npm run build
npm run dev   # conferir /empresa manualmente em claro/escuro/mobile
```

## Notas de Implementação
> Commit: `feat(business): add company management UI`. Novo formulário de usuário → rodar `ecc:security-reviewer`. Arquivos < 300 linhas.
