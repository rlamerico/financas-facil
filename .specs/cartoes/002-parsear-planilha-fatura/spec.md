# [002] Parsear planilha de fatura de cartão

## Objetivo
Transformar uma planilha `.xlsx` de faturas de cartão de crédito num array
tipado de lançamentos normalizados — funções puras, testadas, sem tocar em
banco nem em UI.

## Contexto

O produto é o **Finanças Fácil** (Next.js 16 App Router + TypeScript +
Supabase). Está sendo construído um módulo de Faturas de Cartão de Crédito que
substitui a planilha `files/Faturas Cartão de Crédito.xlsx` do usuário.

**Esta spec entrega SÓ o parser** — funções puras em `src/utils/card-import/`.
Não cria tabela, não faz upload, não renderiza nada. A UI de importação
(spec 006) consome estas funções.

A lib `xlsx` (SheetJS 0.20.3) **já está** no `package.json`, instalada via
tarball do CDN oficial. Não instale nada novo.

### Formato real da planilha (analisado — confie nestes números)

14 abas: `Resumo Cartões` (pivôs, **ignorar** no parser) + 13 abas de fatura,
uma por mês: `Agosto`, `Setembro`, `Outubro`, `Novembro`, `Dezembro`,
`Janeiro 26`, `Fevereiro 2026`, `Março 2026`, `Abril 2026`, `Maio 2026`,
`Junho 2026`, `Julho 2026`, `Agosto 2026`. São 2.704 lançamentos no total.

Cabeçalho na **linha 1**, dados a partir da linha 2. Colunas:

| Coluna | Presença | Observação |
|---|---|---|
| `Data de Compra` | sempre | `Date` na maioria; **107 linhas vêm como string `dd/mm/aaaa`** |
| `Nome no Cartão` | sempre | 15 valores distintos, mas só 11 cartões reais |
| `Final do Cartão` | sempre | vem como **number** (`3783`), não string |
| `Categoria` | sempre | 36 rótulos da operadora; `-` significa "sem categoria" |
| `Descrição` | sempre | texto livre, com espaços à direita |
| `Parcela` | sempre | **corrompida pelo Excel — ver abaixo** |
| `Valor (em US$)` | 4 abas | 0 quando a compra é em BRL |
| `Cotação (em R$)` | 4 abas | 0 quando a compra é em BRL |
| `Valor (em R$)` | sempre | valor final; **38 linhas são negativas**; 10 são `null`; **3 vêm como texto** (`"R$ 9,49"`) |
| `Coluna 1..14`, `Column 8` | lixo | colunas vazias que o Excel criou — ignorar |

### O bug da coluna `Parcela` (regra mais importante desta spec)

O Excel converteu `"6/10"` (parcela 6 de 10) para **data** `2025-10-06` sob
locale pt-BR. Dos 2.704 registros: 861 viraram `Date`, 41 viraram serial
numérico em string (`"46082"`), 1.764 são `"Única"`, e só um punhado sobreviveu
como texto (`"1/14"`, `"12/12"`).

**A regra de decodificação é: `dia` = parcela atual, `mês` = total de parcelas.**

Evidência (mesma compra rastreada mês a mês):

| Aba | Descrição | `Parcela` bruta | Decodificado |
|---|---|---|---|
| Agosto | COMPRA DE PONTOS LATAM | `2025-10-06` | 6/10 |
| Outubro | COMPRA DE PONTOS LATAM | `2025-10-08` | 8/10 |
| Novembro | COMPRA DE PONTOS LATAM | `2025-10-09` | 9/10 |
| Dezembro | COMPRA DE PONTOS LATAM | `2025-10-10` | 10/10 |

O dia avança um por mês e o mês fica fixo — é parcela `N` de `10`.
Confirmação adicional: `"1/14"` e `"2/14"` **sobreviveram como texto** porque
não existe mês 14. Ou seja, parcelamentos com mais de 12 parcelas são os
únicos que o Excel não corrompeu.

### Duas sujeiras a mais no arquivo real

**Linhas de total no rodapé.** 9 linhas não têm data nem descrição — só um
valor. São os totais que o usuário digitou no fim da aba (`Julho 2026` tem 4
delas, com 8.000,46 / 4.775,45 / ...). Se entrarem como lançamento, inflam a
fatura. A heurística é segura: **sem data E sem descrição = linha de total**,
descartada em `ignoredTotalRows` (não é erro, não polui `rejectedRows`).

**Valor como texto.** 3 linhas trazem o valor formatado em string:
`"R$ 9,49"` (recuperável) e `"R$ 45,972,00"` / `"R$ 46,333,00"` (ambíguas —
duas vírgulas, não dá para saber se são 45.972,00 ou 45,97). O parser recupera
o formato BRL bem-formado e **rejeita** o ambíguo com motivo claro, em vez de
adivinhar. Adivinhar valor em dado financeiro é o pior dos dois erros.

### Duplicatas legítimas

33 linhas repetem exatamente (data, descrição, valor, final do cartão) dentro
da mesma aba — pedágio `VIASUL` 3× no mesmo dia, seguro `LOOVI TECHNOLOGY` 3×.
São compras reais distintas. Destas, 31 sobrevivem como entries (2 caem nas
regras de descarte acima). Por isso o identificador de dedupe **precisa** de
um índice de ocorrência, senão a importação perde linhas verdadeiras.

## Stack
- **Linguagem**: TypeScript 5 (strict)
- **Framework**: Next.js 16 — mas estes arquivos são **isomórficos**, sem
  `"use client"`, sem imports de React, sem acesso a `window`
- **Libs relevantes**: `xlsx` (SheetJS 0.20.3, já instalada), `vitest` (testes)
- **Variáveis de ambiente necessárias**: nenhuma

## Dependências
> Nenhuma. Roda em paralelo com as specs 001 e 003.

## O que implementar

### Arquivos a CRIAR
- `src/utils/card-import/installments.ts` — decodificação da coluna `Parcela`
- `src/utils/card-import/installments.test.ts`
- `src/utils/card-import/normalize.ts` — normalização de texto (nome de cartão,
  cabeçalho de coluna), parse de data tolerante, parse de nome de aba → mês/ano
- `src/utils/card-import/normalize.test.ts`
- `src/utils/card-import/fingerprint.ts` — chave de dedupe com índice de ocorrência
- `src/utils/card-import/fingerprint.test.ts`
- `src/utils/card-import/parse-statement.ts` — orquestra tudo: `ArrayBuffer` → `ParsedWorkbook`
- `src/utils/card-import/parse-statement.test.ts`
- `src/utils/card-import/types.ts` — tipos compartilhados

### Arquivos a MODIFICAR
- nenhum

### Lógica principal

1. `parseWorkbook(buffer: ArrayBuffer, fileName: string): ParsedWorkbook`
   lê o arquivo com `XLSX.read(buffer, { type: "array", cellDates: true })`.
   **`cellDates: true` é obrigatório** — sem ele as datas viram serial numérico.
2. Descarta abas cujo nome normalizado contenha `RESUMO` (aba de pivôs).
3. Para cada aba restante:
   a. Converte com `XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true })`.
   b. Mapeia cabeçalhos por nome normalizado (maiúsculo, sem acento, sem
      espaços duplos). Cabeçalhos que casem com `^(COLUNA|COLUMN)\s*\d+$` são
      descartados.
   c. Se faltar qualquer coluna obrigatória (`DATA DE COMPRA`, `NOME NO CARTAO`,
      `FINAL DO CARTAO`, `DESCRICAO`, `VALOR (EM R$)`), a aba inteira entra em
      `skippedSheets` com o motivo — não lança exceção.
   d. Deriva `referenceMonth` / `referenceYear` do nome da aba
      (`"Fevereiro 2026"` → 2/2026; `"Janeiro 26"` → 1/2026;
      `"Agosto"` → mês 8, ano `null`). Ano de 2 dígitos vira `2000 + n`.
4. Para cada linha:
   a. `purchaseDate`: aceita `Date` **e** string `dd/mm/aaaa`. Se não parsear,
      a linha vai para `rejectedRows` com motivo `"data inválida"` (1 linha
      real: descrição `Adapta.Org` sem data).
   b. **Linha de total**: sem data **e** sem descrição → `ignoredTotalRows`,
      sem virar erro (9 linhas reais).
   c. `amount`: aceita number **e** string BRL bem-formada
      (`"R$ 9,49"`, `"1.234,56"`) via regex estrita `^-?\d{1,3}(\.\d{3})*,\d{2}$`
      depois de remover `R$` e espaços. Se for `null` → `rejectedRows` com
      motivo `"valor ausente"` (10 linhas reais, todas `Inclusao de Pagamento`
      sem valor). Se for string que não casa → `"valor inválido"` (2 linhas).
      Negativos são **válidos** e preservados.
   d. `cardLastFour`: `String(valor).replace(/\D/g, "").padStart(4, "0").slice(-4)`
      — o valor vem como number (`3783`), às vezes com `.0`.
   e. `cardNameRaw` é preservado como veio; `cardNameNormalized` é maiúsculo,
      sem acento, com `-`/`_` virando espaço e espaços colapsados.
   f. `categoryLabel`: `"-"`, `""` e `null` viram `null`.
   g. `description`: `trim()`.
   h. `installment*`: via `decodeInstallment` (abaixo).
   i. `amountUsd` / `fxRate`: só quando a coluna existe e o valor é `> 0`;
      senão `null`.
   j. `fingerprint`: via `buildFingerprint` (abaixo).
5. Retorna `ParsedWorkbook` com as linhas, as abas puladas e as linhas
   rejeitadas — **o parser nunca lança por dado ruim**, só por arquivo ilegível.

### Schema / Tipos

```typescript
// src/utils/card-import/types.ts

export interface ParsedEntry {
  sheetName: string;
  rowNumber: number;            // linha na planilha (1-based, cabeçalho = 1)
  referenceMonth: number;       // 1-12, do nome da aba
  referenceYear: number | null; // null quando a aba não traz o ano
  purchaseDate: string;         // ISO "YYYY-MM-DD"
  cardNameRaw: string;
  cardNameNormalized: string;
  cardLastFour: string;         // sempre 4 dígitos
  categoryLabel: string | null;
  description: string;
  amount: number;               // BRL, pode ser negativo
  amountUsd: number | null;
  fxRate: number | null;
  installmentCurrent: number | null;
  installmentTotal: number | null;
  rawInstallment: string | null;
  fingerprint: string;
}

export interface RejectedRow {
  sheetName: string;
  rowNumber: number;
  reason: string;
  raw: Record<string, unknown>;
}

export interface SkippedSheet {
  sheetName: string;
  reason: string;
}

export interface ParsedWorkbook {
  fileName: string;
  entries: ParsedEntry[];
  rejectedRows: RejectedRow[];
  skippedSheets: SkippedSheet[];
  /** Linhas de total do rodapé (sem data e sem descrição). Descartadas de
   *  propósito — não são erro, mas precisam ser reportadas para o usuário
   *  conferir que nenhum lançamento real caiu aqui. */
  ignoredTotalRows: number;
}

export interface DecodedInstallment {
  current: number | null;
  total: number | null;
  raw: string | null;
}
```

```typescript
// src/utils/card-import/installments.ts

/**
 * Decodifica a coluna `Parcela` da fatura.
 *
 * O Excel converteu "6/10" (parcela 6 de 10) em data 2025-10-06 sob locale
 * pt-BR. A regra reversa é: dia = parcela atual, mês = total de parcelas.
 * Parcelamentos com mais de 12 parcelas sobrevivem como texto ("1/14"),
 * porque não existe mês 14.
 */
export function decodeInstallment(value: unknown): DecodedInstallment;
```

Casos que `decodeInstallment` deve cobrir:

| Entrada | `current` | `total` | Observação |
|---|---|---|---|
| `"Única"` / `"UNICA"` / `"unica"` | `1` | `1` | 1.764 linhas |
| `Date(2025-10-06)` | `6` | `10` | 861 linhas |
| `"46082"` (serial Excel) | dia | mês | 41 linhas — converter serial → data primeiro |
| `46082` (number) | dia | mês | mesma regra |
| `"1/14"` | `1` | `14` | texto que sobreviveu |
| `"12/12"` | `12` | `12` | |
| `null` / `""` / `"-"` | `null` | `null` | |
| `"lixo"` | `null` | `null` | `raw` preserva o original |

Conversão de serial Excel → data: `new Date(Date.UTC(1899, 11, 30) + serial * 86400000)`,
lendo dia e mês em **UTC** (`getUTCDate()` / `getUTCMonth() + 1`) para não
escorregar de dia por fuso.

```typescript
// src/utils/card-import/fingerprint.ts

/**
 * Chave de dedupe de um lançamento dentro de uma fatura.
 *
 * NÃO é hash: é uma chave composta legível, o que torna divergência de
 * importação depurável a olho nu.
 *
 * O sufixo `#N` é o índice de ocorrência da mesma chave dentro da MESMA aba,
 * e existe porque 32 linhas da planilha real repetem (data, descrição, valor,
 * cartão) sendo compras distintas — 3 pedágios VIASUL no mesmo dia pelo mesmo
 * valor. Sem o índice, a importação apagaria linhas verdadeiras.
 *
 * Como o índice segue a ordem das linhas da aba, reimportar o mesmo arquivo
 * gera exatamente as mesmas chaves — é isso que dá idempotência (spec 006).
 */
export function buildFingerprint(
  parts: {
    purchaseDate: string;
    description: string;
    amount: number;
    cardLastFour: string;
    installmentCurrent: number | null;
    installmentTotal: number | null;
  },
  occurrence: number,
): string;
// => "2026-07-25|VIASUL|6.60|3783|1/1|#2"
```

## Critérios de Aceitação
- [ ] CA-01: `decodeInstallment` cobre os 8 casos da tabela acima, com um teste
      por caso.
- [ ] CA-02: `parseWorkbook` roda sobre `files/Faturas Cartão de Crédito.xlsx`
      e retorna exatamente: **2.692 entries**, **13 rejectedRows** (1 sem data,
      10 sem valor, 2 com valor ambíguo), **9 `ignoredTotalRows`** e a aba
      `Resumo Cartões` em `skippedSheets`. As 4 contagens somam as 2.714 linhas
      não-vazias do arquivo — confira essa soma no teste.
- [ ] CA-03: nenhuma `fingerprint` se repete dentro da mesma aba, e as **31**
      duplicatas legítimas continuam presentes como entries distintos.
      (São 33 linhas cruas repetidas; 2 delas não viram entry porque o CA-02
      já as descarta — um par `Pagamento Fatura QR CODE` sem valor e um par de
      linha de total do rodapé. 33 − 2 = 31. Medido no arquivo real.)
- [ ] CA-04: reparsear o mesmo arquivo duas vezes produz arrays de
      `fingerprint` idênticos (idempotência).
- [ ] CA-05: as 107 linhas com data em string `dd/mm/aaaa` parseiam para ISO
      correto (dia e mês na ordem certa — `"14/10/2025"` → `"2025-10-14"`, não
      `"2025-14-10"`).
- [ ] CA-06: os 38 lançamentos negativos são preservados com o sinal, não
      filtrados nem convertidos em positivo.
- [ ] CA-06b: `"R$ 9,49"` vira `9.49`; `"R$ 45,972,00"` é rejeitado com motivo
      `"valor inválido"` — nunca convertido por adivinhação.
- [ ] CA-06c: as 9 linhas de total do rodapé não viram entries.
- [ ] CA-07: abas sem coluna obrigatória entram em `skippedSheets` sem lançar
      exceção.
- [ ] CA-08: `npm test` e `npm run typecheck` passam.

## Comandos de Validação
```bash
npm test -- src/utils/card-import
npm run typecheck

# Teste de integração com o arquivo real (crie-o como parse-statement.test.ts):
# lê files/Faturas Cartão de Crédito.xlsx via fs.readFileSync e confere os
# números do CA-02. O arquivo está versionado no repo, então o teste é estável.
```

## Notas de Implementação
- **Não** use `XLSX.readFile` — ele depende de `fs` e quebra no browser. Use
  `XLSX.read(arrayBuffer, { type: "array", cellDates: true })`, que funciona
  nos dois lados.
- Trate `Valor (em US$)` e `Cotação (em R$)` como opcionais: só 4 das 13 abas
  têm essas colunas, e mesmo nelas o valor é `0` para compras em BRL.
- Não tente adivinhar o ano das abas sem ano (`Agosto`, `Setembro`, ...).
  Devolva `referenceYear: null` e deixe a UI de importação perguntar — chutar
  ano em dado financeiro é como se cria fatura duplicada no ano errado.
- Descrições vêm com espaço à direita (`"Inclusao de Pagamento    "`). O `trim()`
  é o que faz as regras de exclusão (spec 005) casarem.
- A heurística de linha de total (sem data **e** sem descrição) é
  deliberadamente conservadora. Uma linha sem data mas **com** descrição
  (`Adapta.Org`) é tratada como erro e reportada — é provável que seja um
  lançamento de verdade que o usuário precisa corrigir na origem, não lixo.
