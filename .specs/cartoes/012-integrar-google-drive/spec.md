# [012] Importar fatura automaticamente do Google Drive

> **Fase 4 — pós-MVP.** O MVP 1 é importação manual (spec 006). Esta spec só
> faz sentido depois que o fluxo manual estiver rodando com dados reais.

## Objetivo
Eliminar o upload manual: a fatura cai numa pasta do Google Drive e aparece
importada no app.

## Contexto

O **Finanças Fácil** (Next.js 16 App Router + Supabase) tem um módulo de
Faturas de Cartão de Crédito com importação **manual** de `.xlsx` (spec 006).
O usuário pediu, desde o começo, que a automação viesse depois.

O projeto **já tem** o padrão de integração externa pronto, e a automação nova
deve seguí-lo em vez de inventar outro:

- `src/app/api/webhooks/n8n/route.ts` — Route Handler que recebe payload do n8n
- `src/app/api/webhooks/sheet-sync/route.ts` — o mesmo para a planilha de
  finanças familiares (sync espelho via Apps Script)
- `src/utils/webhook-auth.ts` — autenticação por segredo compartilhado
- `src/utils/validation/webhook-payload-schema.ts` — validação Zod da entrada
- `src/services/supabase/service-role.ts` — client `service_role`, usado **só**
  no servidor, que bypassa RLS e por isso valida `profile_id` explicitamente
- tabela `integrations_log` — histórico de execuções

O n8n já é a peça de automação da arquitetura do produto (bank sync, alertas,
backup semanal). **O caminho recomendado é n8n**, não uma integração OAuth com o
Drive dentro do Next.js: o n8n já tem trigger de Google Drive, já tem as
credenciais, e mantém o segredo fora do app.

### Fluxo proposto

```
Google Drive (pasta "Faturas")
      │  trigger: novo arquivo
      ▼
     n8n  ── baixa o .xlsx ── converte para JSON de lançamentos
      │
      ▼
POST /api/webhooks/card-import   (segredo compartilhado)
      │
      ▼
 Supabase: card_statements + card_entries (mesma lógica idempotente da spec 006)
```

**Decisão importante:** o parser (spec 002) é isomórfico e roda no servidor sem
alteração. O webhook deve **reusar** `parseWorkbook`, `resolveCardByEntry`,
`applyExclusionRules` e `buildImportPlan` — nada de reimplementar a
normalização no n8n, onde ela ficaria fora dos testes.

### O ponto que exige decisão do usuário

A importação manual resolve **interativamente** duas coisas que a automática não
pode: cartão desconhecido e aba sem ano no nome. O webhook precisa de uma
política — a recomendada é **quarentena**: importar o que é resolvível e deixar
o resto pendente de revisão no app, nunca chutar.

## Stack
- **Linguagem**: TypeScript 5 (strict)
- **Framework**: Next.js 16 (Route Handlers, runtime Node.js)
- **Banco de dados**: Supabase (`service_role` no servidor)
- **Automação**: n8n
- **Libs relevantes**: `xlsx`, `zod`
- **Variáveis de ambiente necessárias**: `CARD_IMPORT_WEBHOOK_SECRET` e
  `SUPABASE_SERVICE_ROLE_KEY` — **ambas só no servidor**. Em repositório
  sincronizado com o Google Drive, segredo **não** vai para `.env.local`: vem do
  `.envrc` (ver `~/.claude/SUPABASE.md`). Nunca em variável `NEXT_PUBLIC_*`.

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `006-importar-fatura` — toda a lógica de plano e gravação idempotente
- [ ] Decisão do usuário sobre a política de quarentena

Pré-condição verificável: `src/utils/cards/import-plan.ts` e
`src/utils/webhook-auth.ts` existem.

## O que implementar

### Arquivos a CRIAR
- `supabase/migrations/012_card_import_queue.sql` — fila de importações pendentes
- `src/app/api/webhooks/card-import/route.ts` — o Route Handler
- `src/utils/validation/card-import-payload-schema.ts` — Zod do payload
- `src/utils/validation/card-import-payload-schema.test.ts`
- `src/components/cards/pending-imports-panel.tsx` — revisão da quarentena

### Arquivos a MODIFICAR
- `src/components/cards/cards-view.tsx` — aviso quando houver pendências
- `.env.example` — documentar `CARD_IMPORT_WEBHOOK_SECRET` (sem valor)

### Lógica principal

1. O handler autentica com `src/utils/webhook-auth.ts` (mesmo padrão dos
   webhooks existentes). Sem segredo válido → `401`, sem detalhe do erro.
2. Valida o payload com Zod. Payload inválido → `400` + registro em
   `integrations_log` com `status = 'error'`.
3. Aceita o arquivo em base64 **ou** uma URL assinada de download. Limite o
   tamanho (o arquivo real tem 228 KB; um teto de 20 MB é folgado).
4. Roda `parseWorkbook` + `buildImportPlan` no servidor, com os cartões e regras
   do perfil.
5. Grava o que estiver **totalmente resolvido** (cartão conhecido + ano
   conhecido), com a mesma lógica idempotente da spec 006 — inserindo só
   fingerprints novas.
6. O que não resolveu vai para `card_import_queue` com o motivo; o app mostra o
   painel de revisão, onde o usuário resolve e confirma.
7. Registra tudo em `integrations_log` (`source = 'drive-card-import'`) com o
   resumo: faturas gravadas, lançamentos novos, pendências.
8. Responde `200` com o resumo em JSON, para o n8n logar.

## Critérios de Aceitação
- [ ] CA-01: `POST` sem segredo válido → `401`, sem vazar detalhe.
- [ ] CA-02: payload válido com cartões conhecidos importa igual ao fluxo manual.
- [ ] CA-03: reenviar o mesmo payload não duplica nada.
- [ ] CA-04: fatura com cartão desconhecido ou ano indeterminado vai para a fila
      e **não** grava chute.
- [ ] CA-05: toda execução aparece em `integrations_log`.
- [ ] CA-06: nenhum segredo aparece em variável `NEXT_PUBLIC_*`, em `.env.local`
      nem no bundle do client.
- [ ] CA-07: `npm test`, `npm run typecheck` e `npm run build` passam.

## Comandos de Validação
```bash
npm test -- card-import-payload-schema
npm run typecheck && npm run build

# Teste local do webhook (com o dev server rodando)
curl -X POST http://localhost:3000/api/webhooks/card-import \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $CARD_IMPORT_WEBHOOK_SECRET" \
  -d '{"profileId":"<uuid>","fileName":"fatura.xlsx","fileBase64":"..."}'
```

## Notas de Implementação
- **Reuse** o parser. Reimplementar a decodificação de parcela dentro de um nó
  de código do n8n coloca a regra mais delicada do módulo fora da suíte de
  testes.
- `service_role` bypassa RLS: valide `profile_id` explicitamente no handler,
  como os webhooks existentes já fazem.
- Alternativa considerada e **descartada**: OAuth do Google Drive dentro do
  Next.js. Traria gestão de refresh token e escopo de Drive para dentro do app,
  para resolver algo que o n8n — que já está na arquitetura — resolve com um
  trigger. Só reconsidere se o n8n sair do stack.
