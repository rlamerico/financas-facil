# [003] Criar utilitário de conversão de moeda

## Objetivo
Função pura e testada que calcula o valor em BRL de um recebimento em USD, com arredondamento único e previsível.

## Contexto
Módulo Empresas do Finanças Fácil (Next.js 15/16 + TypeScript, testes com Vitest). Recebimentos do exterior têm valor em USD
e cotação; a contabilidade exige o valor em BRL em centavos. Para evitar divergência de centavos, TODA conversão do sistema deve
passar por esta função (DRY). Utilitários puros ficam em `src/utils/` com o `.test.ts` ao lado (ex.: `src/utils/period-comparison.ts`
+ `period-comparison.test.ts`). Esta spec é independente do banco.

## Stack
- **Linguagem**: TypeScript
- **Libs relevantes**: Vitest (`npm test` = `vitest run`)
- **Variáveis de ambiente necessárias**: nenhuma

## Dependências
- Nenhuma

## O que implementar

### Arquivos a CRIAR
- `src/utils/business/convert-currency.ts`
- `src/utils/business/convert-currency.test.ts`

### Lógica principal (TDD: escrever o teste primeiro)
1. `convertToBrl(amountUsd: number, rate: number): number` → `round2(amountUsd * rate)`.
2. `round2` arredonda meio-para-cima em centavos, imune a erro de ponto flutuante (ex.: `1.005 → 1.01`):
   `Math.round((x + Number.EPSILON) * 100) / 100`. Exportar `round2` (outras specs reutilizam).
3. Lançar `Error` claro se `amountUsd <= 0`, `rate <= 0` ou algum valor não for finito.
4. `impliedRate(amountUsd: number, amountBrl: number): number` → cotação efetiva (BRL/USD) com 6 casas, para exibir quando o usuário edita o BRL.
5. `rateDeviation(effective: number, ptax: number): number` → diferença percentual do efetivo vs PTAX (para sinalizar na UI).

### Schema / Tipos
```typescript
export function round2(value: number): number
export function convertToBrl(amountUsd: number, rate: number): number
export function impliedRate(amountUsd: number, amountBrl: number): number
export function rateDeviation(effective: number, ptax: number): number
```

## Critérios de Aceitação
- [ ] CA-01: `convertToBrl(1000, 5.4321) === 5432.1`; `convertToBrl(100.5, 5.1234)` arredonda a 2 casas corretamente
- [ ] CA-02: erros para zero, negativo, `NaN` e `Infinity`
- [ ] CA-03: `impliedRate(1000, 5432.1)` ≈ 5.4321; `rateDeviation` retorna percentual com sinal
- [ ] CA-04: cobertura ≥ 80% do arquivo

## Comandos de Validação
```bash
npx vitest run src/utils/business/convert-currency.test.ts
npm run typecheck && npm run lint
```

## Notas de Implementação
> Commit: `feat(business): add currency conversion util`. Sem dependência nova (não usar bibliotecas de decimal para esta escala).
> Funções imutáveis, sem efeitos colaterais.
