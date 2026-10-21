# [006] Integrar cotação PTAX (Banco Central)

## Objetivo
Route Handler que devolve a PTAX de venda do dólar para uma data, usada como cotação de referência nos recebimentos do exterior.

## Contexto
Módulo Empresas do Finanças Fácil (Next.js App Router + TypeScript + Zod + Vitest). Ao registrar um recebimento em USD, a UI sugere a
PTAX do dia; o usuário pode editar a cotação/BRL efetivos. A API pública Olinda do BCB não exige chave. Chamada feita no **servidor**
(Route Handler) para evitar CORS e centralizar tratamento de erro. Padrão de rotas: `src/app/api/n8n/` e `src/app/api/webhooks/sheet-sync/`
(olhe-os para estilo de validação Zod e respostas JSON). Esta rota é para usuário autenticado (sessão Supabase via `@supabase/ssr`,
ver `src/services/supabase/server.ts`). Atenção: neste ambiente de desenvolvimento há proxy TLS corporativo; `npm run dev` já exporta
`NODE_EXTRA_CA_CERTS` (via `scripts/dev.sh`), então `fetch` no servidor funciona em dev.

## Stack
- **Linguagem**: TypeScript
- **Framework**: Next.js App Router (Route Handler, runtime Node.js padrão)
- **Libs relevantes**: Zod, Vitest
- **Variáveis de ambiente necessárias**: nenhuma (API pública)

## Dependências
- Nenhuma (independente do banco; só usa a sessão Supabase existente)

## O que implementar

### Arquivos a CRIAR
- `src/utils/business/ptax.ts` + `ptax.test.ts` — montagem da URL, parse da resposta e retrocesso ao último dia útil (funções puras, `fetch` injetável)
- `src/app/api/fx/ptax/route.ts` — `GET /api/fx/ptax?date=YYYY-MM-DD`

### Lógica principal
1. Exigir usuário autenticado; sem sessão → 401.
2. Validar `date` com Zod (`YYYY-MM-DD`, não futura); inválido → 400.
3. Consultar `CotacaoDolarDia(dataCotacao=@dataCotacao)` da API Olinda do BCB
   (`https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='MM-DD-YYYY'&$format=json`).
   Confirmar o formato atual na documentação do BCB antes de implementar.
4. Se a resposta vier vazia (fim de semana/feriado), retroceder dia a dia até 7 dias e retornar a do último dia útil, informando a data efetiva.
5. Resposta: `{ success: true, data: { requestedDate, effectiveDate, buy, sell } }`; falha: `{ success: false, error }` com 502/504 e **timeout** (~5 s).
   Usar `cotacaoVenda` como `ptax_rate` de referência.
6. Cabeçalho `Cache-Control` curto (ex.: `private, max-age=3600`). Nunca logar dados do usuário.

### Schema / Tipos
```typescript
export interface PtaxResult { requestedDate: string; effectiveDate: string; buy: number; sell: number }
```

## Critérios de Aceitação
- [ ] CA-01: data útil retorna cotação; sábado/domingo/feriado retorna a do último dia útil com `effectiveDate` diferente
- [ ] CA-02: data inválida/futura → 400; sem sessão → 401; BCB indisponível/timeout → 502/504 sem derrubar a UI
- [ ] CA-03: testes cobrem parse, retrocesso de dias e erros com `fetch` mockado (sem rede nos testes)
- [ ] CA-04: nenhuma chave/segredo envolvido

## Comandos de Validação
```bash
npx vitest run src/utils/business/ptax.test.ts
npm run typecheck && npm run lint
# manual (com sessão logada no browser): GET /api/fx/ptax?date=2026-10-16
```

## Notas de Implementação
> Commit: `feat(business): add PTAX route handler`. Novo endpoint de API → rodar `ecc:security-reviewer` na rota.
> A UI (spec 010) trata falha da rota liberando digitação manual da cotação.
