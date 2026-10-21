# [011] Integrar fatura ao fluxo de caixa

> **Fase 4 — pós-MVP, opt-in.** Foi decidido que **o módulo de cartões é
> isolado** do fluxo de caixa no MVP. Esta spec existe documentada para quando
> a integração for desejada. **Não execute** sem decisão explícita do usuário.

## Objetivo
Fazer a fatura fechada de um cartão virar **uma** despesa no fluxo de caixa
principal, de forma opcional por cartão, sem contagem dupla.

## Contexto

O **Finanças Fácil** (Next.js 16 App Router + Supabase) tem dois mundos hoje:

- `transactions` — o fluxo de caixa, que alimenta Dashboard, Relatórios e o
  Planejado × Realizado (`budgets`);
- `card_entries` — os lançamentos de fatura de cartão, isolados no módulo novo.

**Por que isolado:** o lançamento de cartão é regime de **competência** (a
compra aconteceu em março), e o fluxo de caixa é regime de **caixa** (o dinheiro
saiu quando a fatura foi paga, em abril). Jogar cada compra em `transactions`
infla o Realizado do mês da compra e conta duas vezes quando a fatura for paga.

**O modelo correto:** quando a fatura fecha, ela vira **uma** transação de
despesa — o pagamento da fatura, que é o que de fato sai da conta.

`transactions` já tem a infraestrutura para isso (migration 008):
`source TEXT NOT NULL DEFAULT 'manual'` (`'manual'` | `'sheet'` | `'n8n'`) e
`external_ref TEXT`, com índice único parcial
`(profile_id, external_ref) WHERE external_ref IS NOT NULL` — a chave de
idempotência. Uma fatura vira uma transação com `source = 'card'` e
`external_ref = 'card_statement:<statement_id>'`.

## Stack
- **Linguagem**: TypeScript 5 (strict) / SQL
- **Framework**: Next.js 16 (App Router)
- **Banco de dados**: Supabase (PostgreSQL + RLS)
- **Libs relevantes**: `@tanstack/react-query`, `zod`
- **Variáveis de ambiente necessárias**: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `001-modelar-schema-cartoes`
- [ ] `007-listar-lancamentos-fatura` — o total considerado da fatura é o valor
      que vai para o caixa
- [ ] **Decisão explícita do usuário** de ativar a integração

## O que implementar

### Arquivos a CRIAR
- `supabase/migrations/011_card_cashflow.sql` — colunas de configuração
- `src/utils/cards/statement-to-transaction.ts` — montagem da transação (pura)
- `src/utils/cards/statement-to-transaction.test.ts`
- `src/hooks/use-statement-payment.ts` — criar/atualizar/desfazer o lançamento
- `src/components/cards/statement-payment-panel.tsx` — UI de fechamento

### Arquivos a MODIFICAR
- `src/components/cards/summary-section.tsx` — ação "Lançar no fluxo de caixa"
  por fatura
- `src/components/cards/credit-card-form.tsx` — configuração por cartão

### Lógica principal

1. Migration:
```sql
ALTER TABLE credit_cards
  ADD COLUMN sync_to_cashflow BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN due_day SMALLINT CHECK (due_day BETWEEN 1 AND 31),
  ADD COLUMN cashflow_category_id UUID REFERENCES categories(id);

ALTER TABLE card_statements
  ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;
```
2. "Fechar fatura" cria **uma** transação:
   - `amount` = total considerado (soma dos não excluídos), com sinal negativo
     (o app trata despesa como valor negativo — confirme em
     `src/hooks/use-transactions.ts`, onde `type: "expense"` filtra `amount < 0`);
   - `date` = vencimento (`reference_year`/`reference_month` + `due_day`);
   - `description` = `"Fatura <cartão> <mês>/<ano>"`;
   - `category_id` = `cashflow_category_id` do cartão;
   - `source = 'card'`, `external_ref = 'card_statement:<id>'`,
     `payment_method = 'credit_card'`.
3. Reabrir a fatura (ignorar/reincluir um lançamento depois de fechada)
   **atualiza** o valor da transação vinculada, nunca cria uma segunda.
4. Desfazer o fechamento apaga a transação vinculada e zera `transaction_id`.
5. Cartão com `sync_to_cashflow = false` (o padrão) nunca cria transação.
6. A UI deixa explícito que os lançamentos individuais **não** vão para o
   Planejado × Realizado por categoria — só o total da fatura entra no caixa.

## Critérios de Aceitação
- [ ] CA-01: fechar uma fatura cria exatamente uma transação com o total
      considerado e `external_ref = 'card_statement:<id>'`.
- [ ] CA-02: fechar duas vezes não duplica (o índice único de `external_ref`
      protege, mas o código também deve tratar).
- [ ] CA-03: mudar exclusões depois do fechamento atualiza o valor da transação.
- [ ] CA-04: desfazer o fechamento remove a transação.
- [ ] CA-05: cartão sem `sync_to_cashflow` nunca gera transação.
- [ ] CA-06: `npm test`, `npm run typecheck` e `npm run build` passam.

## Comandos de Validação
```bash
cat supabase/.temp/project-ref     # esperado: fvbugayxfmkjfbfwvheb
npx supabase db push
npm test -- statement-to-transaction
npm run typecheck && npm run build
```

## Notas de Implementação
- **Nunca** insira `card_entries` um a um em `transactions`. É o caminho que
  parece mais completo e é exatamente o que produz Realizado inflado e
  pagamento contado duas vezes.
- Confirme o sinal de despesa no app antes de implementar: em
  `use-transactions.ts`, `type: "expense"` filtra `amount < 0`.
- `source = 'card'` é um valor novo na coluna `source`. Ela é `TEXT` livre (sem
  CHECK), então não precisa de migration para isso — mas documente o valor no
  comentário da migration.
