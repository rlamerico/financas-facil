# Regras de nomenclatura e estilo — Finanças Fácil

## Arquivos e pastas
- Specs: `.specs/NNN-verbo-substantivo/spec.md`.
- Arquivos TS/TSX em **kebab-case** (`receipt-form.tsx`, `convert-currency.ts`); testes ao lado: `nome.test.ts`.
- Hooks: `src/hooks/use-<recurso>.ts`. Componentes do módulo: `src/components/business/`. Páginas: `src/app/(app)/empresa/...`.
- Utilitários puros do módulo: `src/utils/business/`. Schemas Zod: `src/utils/validation/<nome>-schema(s).ts`.
- Migrations: `supabase/migrations/NNN_nome_em_snake_case.sql` (próximo número livre).

## Código
- Variáveis/funções `camelCase`; tipos/componentes `PascalCase`; constantes `UPPER_SNAKE_CASE`; booleanos com `is/has/should/can`.
- Colunas e tabelas do banco em `snake_case` e em inglês (`business_receipts.amount_brl`). Textos de UI e mensagens de erro em **português do Brasil**.
- Imutabilidade: `const`, sem mutar estado ou argumentos.
- Funções pequenas (< 50 linhas), arquivos < 300 linhas, retornos antecipados em vez de aninhamento profundo.
- Sem números mágicos (constantes nomeadas), sem `console.log`, sem comentários óbvios.
- Tratar erros explicitamente; nunca engolir erro em silêncio. Validar toda entrada de usuário com Zod.

## Dinheiro e datas
- Valores monetários: `NUMERIC(14,2)` no banco; cotações `NUMERIC(12,6)`. Arredondar sempre via `round2` de `src/utils/business/convert-currency.ts`.
- Datas de negócio como `DATE` / string `YYYY-MM-DD`; exibição `DD/MM/AAAA`. Moedas: `'BRL' | 'USD'`.

## Padrões a espelhar
- Dados/hooks: `src/hooks/use-bank-accounts.ts`. Telas: `src/components/bank-accounts/*` e `src/app/(app)/contas/`.
- RLS: `supabase/migrations/006_bank_accounts.sql`. Exportação: `src/utils/export.ts`. Validação: `src/utils/validation/bank-account-schema.ts`.

## Segurança
- Nenhum segredo no código ou em `NEXT_PUBLIC_*`. Chamadas que exigem segredo vão em Route Handler/servidor.
- Formulário novo, endpoint novo ou mudança de RLS → revisar com `ecc:security-reviewer`.
