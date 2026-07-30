# Sync da planilha "Finanças Familiares 2026"

Integração planilha → Finanças Fácil via Google Apps Script (sem n8n, sem
chave de API do Google). O script envia um **snapshot** das abas mensais para
`POST /api/webhooks/sheet-sync`, que faz sync **espelho**: linha nova insere,
linha editada atualiza, linha excluída remove — tocando só transações com
`source='sheet'`.

## Setup (uma vez, ~10 min)

1. **Gere o segredo** e configure no Vercel (e no `.env.local` pra testar):
   ```bash
   openssl rand -hex 32   # copie o valor
   vercel env add SHEET_SYNC_SECRET
   ```
2. **Aplique a migração** `supabase/migrations/008_sheet_sync.sql` no Supabase.
3. **Pegue o UUID do seu perfil admin** (Supabase → Table Editor → `profiles`).
4. Na planilha: **Extensões → Apps Script**, apague o conteúdo padrão e cole
   `sheet-sync.gs`.
5. No editor do Apps Script: **Configurações do projeto → Propriedades do
   script**, adicione:
   | Propriedade | Valor |
   |---|---|
   | `WEBHOOK_URL` | `https://<seu-app>.vercel.app/api/webhooks/sheet-sync` |
   | `WEBHOOK_SECRET` | o valor gerado no passo 1 |
   | `PROFILE_ID` | UUID do passo 3 |
   | `YEAR` | `2026` (opcional) |
6. Rode a função **`setup`** (autorize as permissões pedidas) — cria os
   gatilhos de tempo (15 min) e de edição (máx. 1 sync/min).
7. Rode **`syncNow`** — é a **carga inicial** (importa as ~700 linhas + rendas
   + orçamentos de todas as abas). Confira o resultado no painel `/n8n` do
   app (logs com `source: sheet`) e no Dashboard.

## O que o script lê de cada aba mensal

| Seção da aba | Vai para |
|---|---|
| ENTRADAS (rendas) | `transactions` (receita, dia 1 do mês) |
| Planejamento de Gastos (subcategoria + Planejado) | `budgets.planned_amount` |
| Controle Financeiro (lançamentos) | `transactions` (despesa) |

Regras: o **mês/ano da aba mandam** — lançamento sem data (ou com data de
outro mês, caso de parcelas) entra no dia 1 do mês da aba, com a data
original anotada na descrição. Categorias são casadas por nome
(case/acento-insensitive) e criadas automaticamente se não existirem.

## ⚠️ Não apague a coluna R

O script grava um UUID por linha na **coluna R** das abas mensais. É esse ref
que liga a linha da planilha à transação no sistema (espelho). Apagar a
coluna faria o próximo sync deletar e recriar tudo.

## Solução de problemas

- **HTTP 401** — `WEBHOOK_SECRET` difere de `SHEET_SYNC_SECRET` no Vercel.
- **HTTP 404 (profile)** — `PROFILE_ID` não existe na tabela `profiles`.
- **Nada acontece ao editar** — rode `setup()` de novo (gatilhos ausentes) ou
  aguarde o gatilho de 15 min; edições sincronizam no máx. 1x/min.
- Logs de execução: editor do Apps Script → **Execuções**.
