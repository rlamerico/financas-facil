# EXECUTAR SPECS — Módulo Empresas (Fase 1: Recebimentos)

> Cada task é executada por um subagente com **contexto isolado**: ele lê APENAS a sua `spec.md` (e `shared/`).
> **Não usar `--dangerously-skip-permissions`** (regra global do projeto). Rode o Claude Code normalmente e aprove as ações sensíveis.
> Migrations **nunca** são aplicadas por estas tasks sem aprovação explícita do usuário (ver specs 001, 002 e 012).

---

## PRÉ-REQUISITOS

- [ ] Branch criada: `git switch -c feat/empresa-recebimentos` (a partir de `main`)
- [ ] `node_modules` linkado e `npm install` ok (ver `CLAUDE.md` → Environment setup)
- [ ] `.env.local` preenchido (só `NEXT_PUBLIC_*`); `direnv allow` feito para o token Supabase
- [ ] Baseline verde: `npm run typecheck && npm run lint && npm test`

Cada task termina com **um commit atômico** (`feat(business): ...`, mensagem na spec). Sem `git push`.

---

## ONDA 1 — Fundações independentes (PARALELO)

Quatro tasks sem dependência entre si (arquivos disjuntos). Dispare como subagentes simultâneos.

### Task 001 — Criar schema de empresas
```
Leia `.specs/001-criar-schema-empresas/spec.md` completamente e leia `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação. NÃO aplique a migration no banco.
Ao finalizar, confirme quais CAs foram concluídos.
```

### Task 003 — Criar utilitário de conversão de moeda
```
Leia `.specs/003-criar-utils-conversao-moeda/spec.md` completamente e leia `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação (TDD: teste primeiro).
Ao finalizar, confirme quais CAs foram concluídos.
```

### Task 004 — Criar schemas de validação
```
Leia `.specs/004-criar-schemas-validacao-empresa/spec.md` completamente e leia `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação (TDD: teste primeiro).
Ao finalizar, confirme quais CAs foram concluídos.
```

### Task 006 — Integrar cotação PTAX
```
Leia `.specs/006-integrar-cotacao-ptax/spec.md` completamente e leia `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação (TDD; fetch mockado nos testes).
Ao finalizar, confirme quais CAs foram concluídos.
```

---

## ONDA 2 — Dependem da Onda 1 (PARALELO entre si)

### Task 002 — Criar schema de clientes e recebimentos (requer 001)
```
Leia `.specs/002-criar-schema-clientes-recebimentos/spec.md` completamente e leia `.specs/shared/regras-de-nomenclatura.md`.
Valide a precondição: `supabase/migrations/010_companies.sql` existe. Se não existir, PARE e informe.
Execute TODOS os critérios de aceitação. NÃO aplique a migration no banco.
Ao finalizar, confirme quais CAs foram concluídos.
```

### Task 005 — Criar resumo e exportação contábil (requer 003)
```
Leia `.specs/005-criar-resumo-e-exportacao-contabil/spec.md` completamente e leia `.specs/shared/regras-de-nomenclatura.md`.
Valide a precondição: `src/utils/business/convert-currency.ts` existe. Se não existir, PARE e informe.
Execute TODOS os critérios de aceitação (TDD: teste primeiro).
Ao finalizar, confirme quais CAs foram concluídos.
```

---

## ONDA 3 — Dados no frontend (requer 002 e 004)

### Task 007 — Criar hooks do módulo Empresas
```
Leia `.specs/007-criar-hooks-empresa/spec.md` completamente e leia `.specs/shared/regras-de-nomenclatura.md`.
Valide as precondições: tipos das 3 tabelas em `src/types/database.ts` e `src/utils/validation/business-schemas.ts`. Se faltarem, PARE e informe.
Execute TODOS os critérios de aceitação.
Ao finalizar, confirme quais CAs foram concluídos.
```

---

## ONDA 4 — Interface (SEQUÊNCIA: cada tela depende da anterior)

### Task 008 — Cadastrar empresa + navegação
```
Leia `.specs/008-cadastrar-empresa/spec.md` completamente e leia `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação. Depois, rode `ecc:security-reviewer` no formulário.
Ao finalizar, confirme quais CAs foram concluídos.
```

### Task 009 — Cadastrar clientes
```
Leia `.specs/009-cadastrar-clientes-empresa/spec.md` completamente e leia `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação.
Ao finalizar, confirme quais CAs foram concluídos.
```

### Task 010 — Registrar recebimentos (BRL e USD com PTAX)
```
Leia `.specs/010-registrar-recebimentos/spec.md` completamente e leia `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação.
Ao finalizar, confirme quais CAs foram concluídos.
```

### Task 011 — Exportar relatório para a contabilidade
```
Leia `.specs/011-exportar-relatorio-contabilidade/spec.md` completamente e leia `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação. Reutilize `src/utils/export.ts`.
Ao finalizar, confirme quais CAs foram concluídos.
```

---

## ONDA 5 — Verificação final

### Task 012 — Verificar o módulo
```
Leia `.specs/012-verificar-modulo-empresas/spec.md` completamente e leia `.specs/shared/regras-de-nomenclatura.md`.
Execute TODOS os critérios de aceitação. Pare e peça aprovação ao usuário antes de aplicar qualquer migration.
Ao finalizar, confirme quais CAs foram concluídos.
```

---

## GRAFO DE DEPENDÊNCIAS

```
001 ──► 002 ──┐
004 ──────────┼──► 007 ──► 008 ──► 009 ──► 010 ──► 011 ──► 012
003 ──► 005 ──┘ (005 usada em 011)         ▲
006 ───────────────────────────────────────┘ (006 usada em 010)
003 ───────────────────────────────────────► 010
```

## PÓS-EXECUÇÃO

1. Mover specs concluídas para `.specs/archive/`
2. `npm run typecheck && npm run lint && npm test -- --coverage && npm run build`
3. Aplicar migrations 009/010 **somente** com aprovação do usuário e `cat supabase/.temp/project-ref` conferido
4. `git push` e PR **somente** com aprovação do usuário

---

## PROGRESSO

| Task | Feature | Status | Agente |
|------|---------|--------|--------|
| 001 | criar-schema-empresas | ⏳ Pendente | - |
| 002 | criar-schema-clientes-recebimentos | ⏳ Pendente | - |
| 003 | criar-utils-conversao-moeda | ⏳ Pendente | - |
| 004 | criar-schemas-validacao-empresa | ⏳ Pendente | - |
| 005 | criar-resumo-e-exportacao-contabil | ⏳ Pendente | - |
| 006 | integrar-cotacao-ptax | ⏳ Pendente | - |
| 007 | criar-hooks-empresa | ⏳ Pendente | - |
| 008 | cadastrar-empresa | ⏳ Pendente | - |
| 009 | cadastrar-clientes-empresa | ⏳ Pendente | - |
| 010 | registrar-recebimentos | ⏳ Pendente | - |
| 011 | exportar-relatorio-contabilidade | ⏳ Pendente | - |
| 012 | verificar-modulo-empresas | ⏳ Pendente | - |

Status: ⏳ Pendente | 🔄 Executando | ✅ Concluído | ❌ Erro
