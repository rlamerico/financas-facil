# [005] Criar resumo de recebimentos e linhas de exportação contábil

## Objetivo
Funções puras que totalizam recebimentos por mês/moeda/cliente e geram as linhas que o contador precisa (data, USD, cotação, BRL).

## Contexto
Módulo Empresas do Finanças Fácil (Next.js + TypeScript + Vitest). A contabilidade precisa, por recebimento do exterior:
**dia do recebimento, valor em dólar e valor em reais**. Para o Brasil: data e valor em BRL. Utilitários puros ficam em `src/utils/`
com `.test.ts` ao lado; a exportação de arquivo já existe em `src/utils/export.ts` (`toCsv` com separador `;`, mais JSON e Excel) —
esta spec NÃO faz download, só produz as linhas (array de objetos simples) que `toCsv`/Excel consomem.
Esta spec define o tipo local `ReceiptRow` e não depende do banco.

## Stack
- **Linguagem**: TypeScript
- **Libs relevantes**: Vitest
- **Variáveis de ambiente necessárias**: nenhuma

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `003-criar-utils-conversao-moeda` — reutiliza `round2` para somas e cotação média

## O que implementar

### Arquivos a CRIAR
- `src/utils/business/receipts-summary.ts` + `.test.ts`
- `src/utils/business/accounting-export.ts` + `.test.ts`

### Lógica principal (TDD)
1. `summarizeReceipts(rows, { month: 'YYYY-MM' })` → `{ totalBrl, totalUsd, domesticBrl, foreignBrl, weightedAvgRate, byClient[] }`.
   `weightedAvgRate = Σ amount_brl(USD) / Σ amount_original(USD)`; `null` se não houver USD. Considerar só `status = 'received'`.
2. `toAccountingRows(rows, clientsById)` → linhas ordenadas por data com colunas exatamente:
   `Data (DD/MM/AAAA) | Cliente | Origem (Brasil/Exterior) | Valor USD | Cotação | Valor BRL | NF`. Valor USD e Cotação vazios para BRL.
   Números com vírgula decimal (pt-BR, compatível com o CSV `;` de `export.ts`); documentar a escolha no teste.
3. Linha de totais ao final (`Total`) com soma USD e BRL.
4. Funções imutáveis; entrada vazia retorna totais zerados e `[]`.

### Schema / Tipos
```typescript
export interface ReceiptRow {
  id: string; client_id: string; received_on: string; currency: 'BRL' | 'USD'
  amount_original: number; exchange_rate: number | null; ptax_rate: number | null
  amount_brl: number; invoice_ref: string | null; status: 'expected' | 'received'
}
export interface ClientInfo { id: string; name: string; origin: 'domestic' | 'foreign' }
```

## Critérios de Aceitação
- [ ] CA-01: resumo soma corretamente BRL e USD e calcula a cotação média ponderada
- [ ] CA-02: `expected` fica fora dos totais; mês fora do filtro não entra
- [ ] CA-03: linhas contábeis têm as 7 colunas na ordem pedida, data DD/MM/AAAA, ordenadas por data
- [ ] CA-04: entrada vazia não quebra; cobertura ≥ 80%

## Comandos de Validação
```bash
npx vitest run src/utils/business
npm run typecheck && npm run lint
```

## Notas de Implementação
> Commit: `feat(business): add receipts summary and accounting rows`. Os campos do tipo espelham as colunas de `business_receipts` (spec 002).
