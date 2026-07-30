/**
 * Finanças Fácil — Sync da planilha "Finanças Familiares 2026".
 *
 * Cole este arquivo no editor de Apps Script da planilha
 * (Extensões → Apps Script), configure as Script Properties e rode `setup()`
 * uma vez. Instruções completas: scripts/apps-script/README.md no repositório.
 *
 * Script Properties obrigatórias (Configurações do projeto → Propriedades):
 *   WEBHOOK_URL    → https://<seu-app>/api/webhooks/sheet-sync
 *   WEBHOOK_SECRET → mesmo valor de SHEET_SYNC_SECRET no Vercel
 *   PROFILE_ID     → UUID do seu perfil admin (tabela profiles)
 *   YEAR           → ano das abas (opcional; padrão 2026)
 *
 * O script grava um UUID estável por linha na coluna R (18) das abas
 * mensais — NÃO apague essa coluna: é ela que permite o sync espelho
 * (editar/excluir linha na planilha reflete no sistema).
 */

var MONTH_BY_TAB = {
  JANEIRO: 1, FEVEREIRO: 2, MARÇO: 3, MARCO: 3, ABRIL: 4, MAIO: 5, JUNHO: 6,
  JULHO: 7, AGOSTO: 8, SETEMBRO: 9, OUTUBRO: 10, NOVEMBRO: 11, DEZEMBRO: 12,
};

var REF_COLUMN = 18; // coluna R — refs estáveis das linhas
var MIN_SECONDS_BETWEEN_SYNCS = 60;

/** Rode UMA vez para criar os gatilhos (tempo + edição). */
function setup() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger("syncNow").timeBased().everyMinutes(15).create();
  ScriptApp.newTrigger("onSheetEdit")
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();
  Logger.log("Gatilhos criados. Rode syncNow() para a carga inicial.");
}

/** Gatilho de edição: sincroniza no máximo 1x por minuto. */
function onSheetEdit() {
  var props = PropertiesService.getScriptProperties();
  var last = Number(props.getProperty("LAST_SYNC_AT") || 0);
  var now = Date.now();
  if (now - last < MIN_SECONDS_BETWEEN_SYNCS * 1000) {
    return;
  }
  props.setProperty("LAST_SYNC_AT", String(now));
  syncNow();
}

/** Monta o snapshot de todas as abas mensais e envia pro Finanças Fácil. */
function syncNow() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty("WEBHOOK_URL");
  var secret = props.getProperty("WEBHOOK_SECRET");
  var profileId = props.getProperty("PROFILE_ID");
  var year = Number(props.getProperty("YEAR") || 2026);

  if (!url || !secret || !profileId) {
    throw new Error(
      "Configure WEBHOOK_URL, WEBHOOK_SECRET e PROFILE_ID nas Script Properties.",
    );
  }

  var months = [];
  SpreadsheetApp.getActive()
    .getSheets()
    .forEach(function (sheet) {
      var month = MONTH_BY_TAB[sheet.getName().trim().toUpperCase()];
      if (month) {
        months.push(readMonthTab(sheet, month, year));
      }
    });

  if (months.length === 0) {
    throw new Error("Nenhuma aba mensal encontrada (JANEIRO..DEZEMBRO).");
  }

  var response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: { "x-webhook-secret": secret },
    payload: JSON.stringify({ profile_id: profileId, months: months }),
    muteHttpExceptions: true,
  });

  Logger.log("HTTP %s — %s", response.getResponseCode(), response.getContentText());
  if (response.getResponseCode() >= 400) {
    throw new Error("Sync falhou: " + response.getContentText());
  }
}

/**
 * Lê uma aba mensal: ENTRADAS (rendas), Planejamento (orçamentos) e
 * Controle Financeiro (lançamentos). Garante ref UUID na coluna R das
 * linhas de lançamento/entrada.
 */
function readMonthTab(sheet, month, year) {
  var lastRow = sheet.getLastRow();
  var values = sheet.getRange(1, 1, lastRow, REF_COLUMN).getValues();
  var timezone = Session.getScriptTimeZone();

  var incomes = [];
  var budgets = [];
  var transactions = [];
  var refsToWrite = []; // [linha, uuid]

  function ensureRef(rowIndex) {
    var current = values[rowIndex][REF_COLUMN - 1];
    if (current && String(current).trim() !== "") {
      return String(current).trim();
    }
    var ref = Utilities.getUuid();
    values[rowIndex][REF_COLUMN - 1] = ref;
    refsToWrite.push([rowIndex + 1, ref]);
    return ref;
  }

  var section = null; // 'incomes' | 'budgets' | 'ledger'

  for (var i = 0; i < lastRow; i++) {
    var colB = values[i][1];
    var labelB = typeof colB === "string" ? colB.trim() : "";

    // Transições de seção pelos marcadores da planilha
    if (labelB === "ENTRADAS") { section = "incomes"; continue; }
    if (labelB === "Renda Total") { section = null; continue; }
    if (labelB === "Categorias") { section = "budgets"; continue; }
    if (labelB === "SALDO" || labelB === "Controle Financeiro") { section = null; continue; }
    if (labelB === "Data") { section = "ledger"; continue; }

    if (section === "incomes") {
      var incomeValue = values[i][2]; // C
      if (typeof incomeValue === "number" && incomeValue > 0) {
        incomes.push({
          ref: ensureRef(i),
          description: labelB || "Renda",
          amount: incomeValue,
        });
      }
      continue;
    }

    if (section === "budgets") {
      var planned = values[i][2]; // C
      var isSubcategory = labelB !== "" && labelB !== labelB.toUpperCase();
      if (isSubcategory && typeof planned === "number" && planned > 0) {
        budgets.push({ category: labelB, planned: planned });
      }
      continue;
    }

    if (section === "ledger") {
      var category = values[i][2]; // C — Item de Despesa
      var amount = values[i][5]; // F — Valor (R$)
      if (typeof category !== "string" || category.trim() === "") continue;
      if (typeof amount !== "number" || amount <= 0) continue;

      var rawDate = values[i][1]; // B — Data (opcional)
      var isoDate =
        rawDate instanceof Date
          ? Utilities.formatDate(rawDate, timezone, "yyyy-MM-dd")
          : null;
      var description = values[i][3]; // D — Descrição (opcional)
      var payment = values[i][6]; // G — Forma de pagamento

      transactions.push({
        ref: ensureRef(i),
        date: isoDate,
        category: category.trim(),
        description:
          typeof description === "string" && description.trim() !== ""
            ? description.trim()
            : null,
        amount: amount,
        payment_method:
          typeof payment === "string" && payment.trim() !== ""
            ? payment.trim()
            : null,
      });
    }
  }

  // Persiste os refs novos (1 write por linha nova; só na primeira carga
  // isso é volumoso — depois vira raro).
  refsToWrite.forEach(function (pair) {
    sheet.getRange(pair[0], REF_COLUMN).setValue(pair[1]);
  });

  return {
    month: month,
    year: year,
    incomes: incomes,
    budgets: budgets,
    transactions: transactions,
  };
}
