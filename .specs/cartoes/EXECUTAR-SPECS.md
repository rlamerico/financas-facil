# EXECUTAR SPECS — Módulo de Faturas de Cartão de Crédito

> ⚠️ Execute com: `claude --dangerously-skip-permissions`
>
> Este arquivo dispara subagentes independentes para cada feature.
> Cada agente tem contexto isolado — lê **apenas** a sua spec.

**O que este módulo entrega:** substitui a planilha
`files/Faturas Cartão de Crédito.xlsx`, com importação manual do `.xlsx`, visão
"Resumo Cartões" por mês, todos os lançamentos com exclusão reversível, e a
visão de longo prazo com seleção e agrupamento de cartões.

**Duas decisões de arquitetura que valem para todas as specs:**
1. O módulo é **isolado** do fluxo de caixa (`transactions`). Lançamentos de
   cartão não entram no Dashboard nem no Planejado × Realizado. A integração
   opcional é a spec 011, fora do MVP.
2. A categoria da operadora fica em `card_entries.category_label` (texto cru),
   com `category_id` opcional para quem quiser mapear. A taxonomia da bandeira
   não polui as categorias do orçamento.

---

## PRÉ-REQUISITOS

Antes de executar, confirme:
- [ ] `node_modules` é symlink para o disco local e `npm install` rodou
      (ver `shared/como-executar.md` — o repo fica dentro do Google Drive)
- [ ] `NODE_EXTRA_CA_CERTS` configurado (proxy TLS desta máquina)
- [ ] `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `direnv allow` feito, `SUPABASE_ACCESS_TOKEN` exportado
- [ ] `cat supabase/.temp/project-ref` devolve `fvbugayxfmkjfbfwvheb`
- [ ] Branch criada: `git checkout -b feat/modulo-cartoes`
- [ ] `npm run build` passa **antes** de começar (baseline verde)

Todo agente deve ler `shared/como-executar.md` e
`shared/regras-de-nomenclatura.md` antes da sua spec.

---

## FASE 1 — Fundação (PARALELO)

As três não têm dependência entre si: uma mexe em SQL, outra em utils puros,
outra em rota/navegação. Dispare as três de uma vez.

### Task 001 — Modelar schema de cartões
```
Leia o arquivo `.specs/001-modelar-schema-cartoes/spec.md` completamente,
junto com `.specs/shared/como-executar.md` e `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação descritos nele.
Ao finalizar, confirme quais CAs foram concluídos.
```

### Task 002 — Parsear planilha de fatura
```
Leia o arquivo `.specs/002-parsear-planilha-fatura/spec.md` completamente,
junto com `.specs/shared/como-executar.md` e `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação descritos nele.
Ao finalizar, confirme quais CAs foram concluídos.
```

### Task 003 — Criar shell do módulo
```
Leia o arquivo `.specs/003-criar-shell-modulo-cartoes/spec.md` completamente,
junto com `.specs/shared/como-executar.md` e `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação descritos nele.
Ao finalizar, confirme quais CAs foram concluídos.
```

> **Checkpoint da Fase 1:** `npm run build` e `npm test` verdes; `/cartoes`
> abre com as 4 abas vazias; as 5 tabelas existem no Supabase **com RLS**.

---

## FASE 2 — Cadastros (PARALELO)

Ambas dependem da Fase 1. Não dependem uma da outra.

> ⚠️ **Fronteira de arquivos:** a 004 é dona de `credit-cards-section.tsx` e
> `cards-view.tsx`; a 005 entrega `ExclusionRulesSection` autossuficiente e
> **não** edita esses dois arquivos. A ligação do painel de regras na aba é
> feita pelo orquestrador depois que as duas pousarem.

### Task 004 — Cadastrar cartões e apelidos
```
Leia o arquivo `.specs/004-cadastrar-cartoes/spec.md` completamente,
junto com `.specs/shared/como-executar.md` e `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação descritos nele.
Ao finalizar, confirme quais CAs foram concluídos.
```

### Task 005 — Configurar regras de exclusão
```
Leia o arquivo `.specs/005-configurar-regras-exclusao/spec.md` completamente,
junto com `.specs/shared/como-executar.md` e `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação descritos nele.
Ao finalizar, confirme quais CAs foram concluídos.
```

---

## FASE 3 — Importação (SEQUENCIAL)

A 006 costura tudo que veio antes. **Não paralelize** — ela consome as
interfaces das specs 002, 004 e 005 e é onde a divergência entre elas aparece.

### Task 006 — Importar fatura (upload manual)
```
Leia o arquivo `.specs/006-importar-fatura/spec.md` completamente,
junto com `.specs/shared/como-executar.md` e `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação descritos nele.
Ao finalizar, confirme quais CAs foram concluídos.
```

> **Checkpoint obrigatório:** importe `files/Faturas Cartão de Crédito.xlsx` de
> verdade e depois importe **o mesmo arquivo de novo**. A segunda vez tem que
> resultar em **0 lançamentos novos**. Se duplicar, pare tudo: o resto do módulo
> é construído em cima desses dados.

---

## FASE 4 — Visualizações

### Task 007 — Listar e ajustar lançamentos (SEQUENCIAL, depois da 006)
```
Leia o arquivo `.specs/007-listar-lancamentos-fatura/spec.md` completamente,
junto com `.specs/shared/como-executar.md` e `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação descritos nele.
Ao finalizar, confirme quais CAs foram concluídos.
```

### Task 008 — Resumir cartões do mês (depois da 007)
```
Leia o arquivo `.specs/008-resumir-cartoes-mes/spec.md` completamente,
junto com `.specs/shared/como-executar.md` e `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação descritos nele.
Ao finalizar, confirme quais CAs foram concluídos.
```

### Task 009 — Analisar longo prazo (depois da 008)
```
Leia o arquivo `.specs/009-analisar-longo-prazo/spec.md` completamente,
junto com `.specs/shared/como-executar.md` e `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação descritos nele.
Ao finalizar, confirme quais CAs foram concluídos.
```

> **Fim do MVP 1.** As specs 001–009 entregam tudo que foi pedido: import
> manual, visão por cartão no mês, lançamentos com exclusão, visão de longo
> prazo com seleção e agrupamento.

---

## FASE 5 — Melhorias (opcional, depois do MVP validado com dados reais)

### Task 010 — Projetar parcelas futuras
```
Leia o arquivo `.specs/010-projetar-parcelas-futuras/spec.md` completamente,
junto com `.specs/shared/como-executar.md` e `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação descritos nele.
Ao finalizar, confirme quais CAs foram concluídos.
```

### Task 011 — Integrar fatura ao fluxo de caixa
> ⛔ **Só execute com decisão explícita do usuário.** A decisão atual é
> **módulo isolado**. Esta spec inverte isso.

### Task 012 — Importar automaticamente do Google Drive
> Só faz sentido depois que o fluxo manual (006) estiver rodando com dados
> reais. Exige decisão sobre a política de quarentena.

---

## PÓS-EXECUÇÃO

1. Mova as specs concluídas para `.specs/archive/`.
2. Rode a suíte completa:
   ```bash
   npm run lint && npm run typecheck && npm test && npm run build
   ```
3. Confira os números contra a planilha original: o total de um mês no Resumo
   deve bater com o "Total geral" da aba "Resumo Cartões" daquele mês
   (ex.: Novembro = 26.274,65 — diferenças costumam ser lançamentos que o
   usuário já tinha apagado à mão na planilha).
4. Revisão de segurança antes de commitar: RLS habilitada nas 5 tabelas, nenhum
   segredo em variável `NEXT_PUBLIC_*`, inputs validados com Zod.
5. Commits atômicos por spec: `feat(cartoes): <o que a spec entregou>`.
6. **Não** faça `git push` sem aprovação explícita do usuário.

---

## PROGRESSO

| Task | Feature | Fase | Status | Agente |
|------|---------|------|--------|--------|
| 001 | modelar-schema-cartoes | 1 (paralelo) | ✅ Concluído | subagente (06/09/2026) |
| 002 | parsear-planilha-fatura | 1 (paralelo) | ✅ Concluído | subagente (06/09/2026) |
| 003 | criar-shell-modulo-cartoes | 1 (paralelo) | ✅ Concluído | subagente (06/09/2026) |
| 004 | cadastrar-cartoes | 2 (paralelo) | ✅ Concluído | subagente (06/09/2026) |
| 005 | configurar-regras-exclusao | 2 (paralelo) | ✅ Concluído | subagente (06/09/2026) |
| 006 | importar-fatura | 3 (sequencial) | ⏳ Pendente | - |
| 007 | listar-lancamentos-fatura | 4 (sequencial) | ⏳ Pendente | - |
| 008 | resumir-cartoes-mes | 4 (sequencial) | ⏳ Pendente | - |
| 009 | analisar-longo-prazo | 4 (sequencial) | ⏳ Pendente | - |
| 010 | projetar-parcelas-futuras | 5 (opcional) | ⏳ Pendente | - |
| 011 | integrar-fatura-fluxo-caixa | 5 (bloqueada) | ⛔ Requer decisão | - |
| 012 | integrar-google-drive | 5 (pós-MVP) | ⏳ Pendente | - |

Status: ⏳ Pendente | 🔄 Executando | ✅ Concluído | ❌ Erro | ⛔ Bloqueada

---

## MAPA DE DEPENDÊNCIAS

```
001 (schema) ─┬─────────────────┬──────────────┬──────────────┐
              │                 │              │              │
002 (parser) ─┼── 005 (regras) ─┤              │              │
              │                 │              │              │
003 (shell) ──┴── 004 (cartões)─┴── 006 ─── 007 ─── 008 ─── 009
                                   (import)  (lanç.) (resumo) (longo prazo)
                                                │                  │
                                                └──── 010 ─────────┘
                                                    (parcelas futuras)
                                   006 ─── 012 (drive)
                                   007 ─── 011 (fluxo de caixa, bloqueada)
```
