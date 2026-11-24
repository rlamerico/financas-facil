# Template: spec.md

Use este template para cada feature. Preencha TODOS os campos — campos vazios são proibidos.

---

```markdown
# [NNN] Nome da Feature

## Objetivo
Uma frase clara do que esta feature entrega ao usuário final.

## Contexto
Descreva o contexto do sistema neste ponto. O subagente que executar esta spec
NÃO tem acesso a outras specs, então inclua aqui tudo que ele precisa saber:
- O que já existe no sistema (assumindo que specs anteriores rodaram)
- O problema que esta feature resolve
- Qualquer decisão de arquitetura relevante

## Stack
- **Linguagem**: (ex: TypeScript, Python, etc.)
- **Framework**: (ex: Next.js 14, FastAPI, etc.)
- **Banco de dados**: (ex: Supabase/PostgreSQL, SQLite, etc.)
- **Libs relevantes**: (liste apenas as usadas nesta feature)
- **Variáveis de ambiente necessárias**: (liste as que esta feature precisa)

## Dependências
> Estas specs devem estar CONCLUÍDAS antes de executar esta:
- [ ] `NNN-nome-spec-anterior` — motivo da dependência

## O que implementar

### Arquivos a CRIAR
- `path/relativo/arquivo.ts` — descrição do que faz

### Arquivos a MODIFICAR
- `path/relativo/arquivo.ts` — o que muda e por quê

### Lógica principal
Descreva o comportamento esperado em passos numerados:
1. ...
2. ...
3. ...

### Schema / Tipos (se aplicável)
```typescript
// Cole aqui interfaces, tipos, schemas Zod, etc.
```

### Queries / Mutations (se banco de dados)
Descreva as operações de banco necessárias.

## Critérios de Aceitação
- [ ] CA-01: (comportamento verificável)
- [ ] CA-02: (comportamento verificável)
- [ ] CA-03: (comportamento verificável)

## Comandos de Validação
```bash
# Comandos para testar se a feature está funcionando
# Ex: curl, npm test, query SQL, etc.
```

## Notas de Implementação
> Decisões técnicas, alternativas consideradas, gotchas conhecidos.
```
