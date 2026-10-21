# [011] Exportar relatório para a contabilidade

## Objetivo
Tela que mostra a prévia mensal dos recebimentos e exporta CSV/Excel com data, valor em USD, cotação e valor em BRL para o contador.

## Contexto
Módulo Empresas do Finanças Fácil (Next.js App Router, Tailwind v4, Radix UI, React Query). Já existem: shell e seletor de empresa (spec 008),
hooks `useBusinessReceipts` e `useBusinessClients` (spec 007), e utilitários `summarizeReceipts` e `toAccountingRows` (spec 005; colunas:
Data DD/MM/AAAA | Cliente | Origem | Valor USD | Cotação | Valor BRL | NF, mais linha Total). A exportação de arquivos já existe em
`src/utils/export.ts` (CSV com `;`, JSON, Excel via `xlsx`) e é usada por Relatórios — **reutilize, não duplique**; leia o arquivo para os nomes
exatos das funções de download. Referência de tela de exportação: `src/components/reports/`.

## Stack
- **Linguagem**: TypeScript
- **Framework**: Next.js App Router, Tailwind v4, Radix UI
- **Libs relevantes**: React Query, `xlsx` (já instalada)
- **Variáveis de ambiente necessárias**: nenhuma nova

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `010-registrar-recebimentos` — dados reais para exportar
- [ ] `005-criar-resumo-e-exportacao-contabil` — linhas e totais

## O que implementar

### Arquivos a CRIAR
- `src/app/(app)/empresa/contabilidade/page.tsx`
- `src/components/business/accounting-view.tsx` — seletor de mês (padrão: mês anterior), cards de resumo (Total BRL, Total USD, cotação média ponderada, nº de recebimentos) e tabela de prévia
- `src/components/business/accounting-export-buttons.tsx` — botões "Baixar CSV" e "Baixar Excel"

### Lógica principal
1. Carregar recebimentos `received` do mês e os clientes; montar linhas com `toAccountingRows` e totais com `summarizeReceipts`.
2. Prévia idêntica ao arquivo exportado (mesmas colunas e formatação).
3. Nome do arquivo: `recebimentos-<cnpj-ou-fantasia>-AAAA-MM.csv|xlsx`, sem caracteres inválidos.
4. Mês sem recebimentos: estado vazio e botões desabilitados.
5. Mostrar aviso quando houver recebimentos USD sem PTAX de referência (informativo).

## Critérios de Aceitação
- [ ] CA-01: prévia e arquivo exportado têm as mesmas linhas e totais (Data, USD, Cotação, BRL, NF)
- [ ] CA-02: CSV abre corretamente no Excel pt-BR (separador `;`, vírgula decimal, acentos)
- [ ] CA-03: mês vazio desabilita exportação
- [ ] CA-04: nenhuma lógica de exportação duplicada (usa `src/utils/export.ts`)
- [ ] CA-05: `typecheck`, `lint`, `test`, `build` passam

## Comandos de Validação
```bash
npm run typecheck && npm run lint && npm test && npm run build
npm run dev   # baixar CSV/Excel de um mês com recebimentos USD e BRL e conferir
```

## Notas de Implementação
> Commit: `feat(business): add accounting export page`. O acesso do contador (role `viewer`) fica para fase futura.
