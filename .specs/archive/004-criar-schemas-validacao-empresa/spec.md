# [004] Criar schemas de validação do módulo Empresas

## Objetivo
Schemas Zod (e validador de CNPJ) que garantem que empresas, clientes e recebimentos só entram válidos no sistema.

## Contexto
Módulo Empresas do Finanças Fácil (Next.js + TypeScript + Zod + Vitest). Todo input do usuário deve ser validado por schema.
Padrão existente: `src/utils/validation/bank-account-schema.ts` com `bank-account-schema.test.ts` ao lado (olhe-os e espelhe o estilo).
Regras de negócio: empresa tem CNPJ (14 dígitos, dígito verificador válido) e regime `mei | simples | outro`; cliente é `domestic`
(BRL) ou `foreign` (país obrigatório); recebimento em USD exige cotação efetiva > 0, em BRL não tem cotação e `amount_brl = amount_original`.
Esta spec é independente do banco.

## Stack
- **Linguagem**: TypeScript
- **Libs relevantes**: Zod, Vitest
- **Variáveis de ambiente necessárias**: nenhuma

## Dependências
- Nenhuma

## O que implementar

### Arquivos a CRIAR
- `src/utils/validation/cnpj.ts` + `cnpj.test.ts` — `normalizeCnpj(raw)` (remove máscara) e `isValidCnpj(raw)` (dígito verificador; rejeita sequências repetidas)
- `src/utils/validation/business-schemas.ts` + `business-schemas.test.ts` — `companySchema`, `businessClientSchema`, `businessReceiptSchema`

### Lógica principal (TDD)
1. `companySchema`: `legal_name` obrigatório, `trade_name` opcional, `cnpj` transformado para só dígitos e validado, `regime` enum.
2. `businessClientSchema`: `name` obrigatório, `origin` enum, `country` (2 letras maiúsculas) obrigatório se `foreign`, `default_currency` coerente com `origin` (domestic→BRL, foreign→USD por padrão).
3. `businessReceiptSchema` (discriminado por `currency`):
   - USD: `amount_original > 0`, `exchange_rate > 0`, `amount_brl > 0`, `ptax_rate` opcional.
   - BRL: `amount_original > 0`; `exchange_rate` ausente; `amount_brl` igual ao original.
   - `received_on` string `YYYY-MM-DD` válida; data futura só permitida se `status = 'expected'`.
4. Mensagens de erro em português (UI-facing).

### Schema / Tipos
```typescript
export type CompanyInput = z.infer<typeof companySchema>
export type BusinessClientInput = z.infer<typeof businessClientSchema>
export type BusinessReceiptInput = z.infer<typeof businessReceiptSchema>
```

## Critérios de Aceitação
- [ ] CA-01: CNPJ válido com e sem máscara passa; inválido, curto e repetido (`11111111111111`) falham
- [ ] CA-02: USD sem cotação falha; cotação 0 falha; BRL com cotação falha
- [ ] CA-03: cliente `foreign` sem país falha
- [ ] CA-04: data futura com `status=received` falha
- [ ] CA-05: cobertura ≥ 80% dos arquivos novos

## Comandos de Validação
```bash
npx vitest run src/utils/validation/cnpj.test.ts src/utils/validation/business-schemas.test.ts
npm run typecheck && npm run lint
```

## Notas de Implementação
> Commit: `feat(business): add validation schemas`. Testar casos de erro, não só o caminho feliz.
