# [012] Verificar o módulo Empresas (qualidade, segurança e RLS)

## Objetivo
Fechar a Fase 1 provando que o módulo funciona de ponta a ponta, está seguro e isolado entre usuários.

## Contexto
Módulo Empresas do Finanças Fácil (Next.js + Supabase com RLS). As specs 001–011 criaram: tabelas `companies`, `business_clients`,
`business_receipts` (migrations 009/010), utilitários em `src/utils/business/`, schemas em `src/utils/validation/`, rota `/api/fx/ptax`,
hooks `src/hooks/use-{companies,business-clients,business-receipts,active-company,ptax}.ts` e telas em `src/app/(app)/empresa/*`
com componentes em `src/components/business/`. Esta spec NÃO adiciona funcionalidade: só verifica e corrige falhas encontradas.
Regras do projeto: RLS em toda tabela, validação por schema, sem segredos no código, cobertura ≥ 80%, arquivos < 300 linhas, sem `console.log`.

## Stack
- **Linguagem**: TypeScript / SQL
- **Ferramentas**: Vitest, ESLint, `tsc`, MCP Supabase (`get_advisors`), agentes `ecc:security-reviewer` e `ecc:database-reviewer`
- **Variáveis de ambiente necessárias**: `SUPABASE_ACCESS_TOKEN` (direnv) só se for aplicar/validar no banco

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `011-exportar-relatorio-contabilidade` — fluxo completo implementado
- [ ] `001` a `010` — todas as anteriores

## O que implementar

### Arquivos a CRIAR
- Nenhum obrigatório (testes adicionais só se faltar cobertura)

### Arquivos a MODIFICAR
- `tasks/todo.md` — marcar as fases concluídas e acrescentar a seção "Review" do módulo

### Lógica principal
1. Rodar `npm run typecheck && npm run lint && npm test && npm run build`; corrigir falhas.
2. Medir cobertura de `src/utils/business` e `src/utils/validation/{cnpj,business-schemas}` (≥ 80%); acrescentar testes de erro onde faltar.
3. Revisar migrations 009/010 com `ecc:database-reviewer` (RLS, índices, constraints) e a rota PTAX/formulários com `ecc:security-reviewer`.
4. **Somente com aprovação explícita do usuário e após `cat supabase/.temp/project-ref`:** aplicar as migrations, rodar `get_advisors` (security) e testar RLS com 2 usuários
   (usuário B não lê, não altera e não insere em empresa/cliente/recebimento do usuário A; recebimento não aceita cliente de outra empresa).
5. Teste manual completo: cadastrar empresa MEI → cliente Brasil e cliente exterior → recebimento BRL e USD (PTAX + BRL efetivo) → exportar CSV/Excel do mês.
6. Conferir claro/escuro e mobile; checar `git status` sem `.env`/segredos.

## Critérios de Aceitação
- [ ] CA-01: typecheck, lint, test e build limpos
- [ ] CA-02: cobertura ≥ 80% nos módulos novos
- [ ] CA-03: revisões de segurança e de banco sem itens CRITICAL/HIGH em aberto
- [ ] CA-04: isolamento entre usuários comprovado (ou registrado como pendente de aprovação para aplicar migrations)
- [ ] CA-05: fluxo manual completo funciona e o arquivo exportado bate com a tela
- [ ] CA-06: `tasks/todo.md` atualizado

## Comandos de Validação
```bash
npm run typecheck && npm run lint && npm test -- --coverage && npm run build
git status --short
```

## Notas de Implementação
> Commit: `chore(business): verify business module`. Não fazer push sem aprovação do usuário; abrir PR só se solicitado.
