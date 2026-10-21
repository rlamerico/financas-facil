# [010] Registrar recebimentos (Brasil e exterior com câmbio)

## Objetivo
Tela e modal para registrar recebimentos: em BRL para clientes do Brasil e em USD com PTAX sugerida e BRL efetivo editável para clientes do exterior.

## Contexto
Módulo Empresas do Finanças Fácil (Next.js App Router, Tailwind v4, Radix UI, React Query). Já existem: shell do módulo (spec 008),
clientes (spec 009), hooks `useBusinessReceipts*` (spec 007), `businessReceiptSchema` (spec 004), utilitários `convertToBrl`, `impliedRate`,
`rateDeviation` (spec 003) e a rota `GET /api/fx/ptax?date=YYYY-MM-DD` (spec 006, retorna `{ success, data: { requestedDate, effectiveDate, buy, sell } }`).
**Regra de produto (cotação, opção c):** para USD o usuário informa data, valor em USD e o **BRL efetivamente recebido**; a PTAX do dia é buscada
automaticamente e exibida como referência (guardada em `ptax_rate`); a cotação efetiva (`exchange_rate`) é derivada do BRL digitado
(`impliedRate`) ou, alternativamente, o usuário digita a cotação e o BRL é calculado (`convertToBrl`). O contador usa data + USD + BRL.
Padrão de tela: `src/components/transactions/*` e `src/components/bank-accounts/*`.

## Stack
- **Linguagem**: TypeScript
- **Framework**: Next.js App Router, Tailwind v4, Radix UI
- **Libs relevantes**: React Query, Zod
- **Variáveis de ambiente necessárias**: nenhuma nova

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `009-cadastrar-clientes-empresa` — seleção do cliente
- [ ] `003-criar-utils-conversao-moeda` — conversão e cotação implícita
- [ ] `006-integrar-cotacao-ptax` — PTAX de referência
- [ ] `007-criar-hooks-empresa` — hooks de recebimentos

## O que implementar

### Arquivos a CRIAR
- `src/app/(app)/empresa/recebimentos/page.tsx`
- `src/components/business/receipts-view.tsx` — tabela com filtro de mês, cliente e origem; totais do mês no topo (BRL, USD, cotação média)
- `src/components/business/receipt-form.tsx` — modal de novo/editar recebimento
- `src/components/business/receipt-row.tsx`
- `src/hooks/use-ptax.ts` — consulta a rota PTAX por data (React Query, `staleTime` longo, `retry` limitado)

### Lógica principal
1. Escolher o cliente define a moeda (herda `default_currency`); cliente do Brasil mostra só data, valor BRL, NF e observações.
2. Cliente do exterior: ao escolher a data, buscar a PTAX; mostrar "PTAX de DD/MM: R$ X,XXXX" (e a data efetiva se diferir) como sugestão.
   Campos: valor USD, cotação efetiva e BRL recebido — editar um recalcula o outro (`convertToBrl`/`impliedRate`); sugerir BRL = USD × PTAX quando ainda vazio.
3. Exibir desvio entre cotação efetiva e PTAX (`rateDeviation`) como informação, sem bloquear.
4. Se a rota PTAX falhar, mostrar aviso discreto e permitir digitação manual (`ptax_rate` fica nulo).
5. Validar com `businessReceiptSchema`; gravar `amount_original`, `exchange_rate`, `ptax_rate`, `amount_brl`.
6. Status `expected` (previsto) ou `received`; data futura só como previsto.
7. Edição e exclusão com confirmação; anexo (comprovante) fica fora desta spec.

## Critérios de Aceitação
- [ ] CA-01: registrar recebimento BRL de cliente do Brasil grava `amount_brl = amount_original`, sem cotação
- [ ] CA-02: registrar recebimento USD grava USD, cotação efetiva, PTAX de referência e BRL efetivo; editar o BRL atualiza a cotação
- [ ] CA-03: com a rota PTAX indisponível o usuário ainda consegue salvar digitando a cotação
- [ ] CA-04: filtros por mês/cliente/origem funcionam e os totais do mês batem com a lista
- [ ] CA-05: `typecheck`, `lint`, `test`, `build` passam

## Comandos de Validação
```bash
npm run typecheck && npm run lint && npm test && npm run build
npm run dev   # fluxo manual: cliente exterior → recebimento USD → conferir PTAX e BRL
```

## Notas de Implementação
> Commit: `feat(business): add receipts UI with FX`. Formulário novo → `ecc:security-reviewer`. Arquivos < 300 linhas (separar campos de câmbio do form se crescer).
