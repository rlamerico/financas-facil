/**
 * Utilitários de exportação de dados tabulares. CSV/JSON não têm dependência
 * nova (`Blob` + link de download nativos do browser); Excel usa a lib
 * `xlsx` (SheetJS, Fase 9 — instalada a partir do CDN oficial do projeto,
 * `cdn.sheetjs.com`, não do registro npm, porque a versão publicada em
 * `npmjs.com` está desatualizada e tem CVEs conhecidos de alta severidade
 * já corrigidos nas releases mais novas do próprio SheetJS). Reusado pelos
 * Relatórios (Fase 5) e pelo módulo formal de Exportação (Fase 9) — não
 * duplique esta lógica em outro lugar, importe daqui.
 */

import * as XLSX from "xlsx";

/** Converte um array de objetos simples em uma string CSV (separador `;`, compatível com Excel pt-BR). */
export function toCsv<T extends Record<string, unknown>>(rows: T[]): string {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header])).join(";"),
  );

  return [headers.join(";"), ...lines].join("\n");
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);
  const needsQuoting = /[";\n]/.test(stringValue);
  const escaped = stringValue.replace(/"/g, '""');

  return needsQuoting ? `"${escaped}"` : escaped;
}

/** Converte um array de objetos em JSON formatado (indentado, legível). */
export function toJson<T>(rows: T[]): string {
  return JSON.stringify(rows, null, 2);
}

/**
 * Dispara o download de um arquivo de texto no browser via `Blob` + link
 * temporário. Client-only (usa `document`/`URL`) — chame de dentro de um
 * handler de evento em Client Component.
 */
export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCsv<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
): void {
  downloadTextFile(filename, toCsv(rows), "text/csv;charset=utf-8;");
}

export function downloadJson<T>(filename: string, rows: T[]): void {
  downloadTextFile(filename, toJson(rows), "application/json;charset=utf-8;");
}

/** Uma aba de planilha: nome + linhas (mesmo formato de `toCsv`/`toJson`, um array de objetos simples). */
export interface ExcelSheet<T extends Record<string, unknown> = Record<string, unknown>> {
  name: string;
  rows: T[];
}

/**
 * Sanitiza um nome de aba pro limite do formato XLSX: máximo 31 caracteres,
 * sem os símbolos `[ ] : * ? / \` (Excel rejeita a aba inteira se algum
 * desses aparecer no nome).
 */
function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[[\]:*?/\\]/g, "").trim();
  return (cleaned || "Dados").slice(0, 31);
}

/**
 * Monta um `XLSX.WorkBook` com uma aba por item de `sheets` — função pura,
 * sem `Blob`/`document`, por isso é a parte testável sem depender de APIs
 * de browser (o teste cobre a estrutura do workbook, não o disparo do
 * download em si).
 */
export function buildWorkbook(sheets: ExcelSheet[]): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  for (const { name, rows } of sheets) {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(name));
  }

  return workbook;
}

/**
 * Exporta uma única tabela em `.xlsx`, disparando o download no browser
 * (client-only — `XLSX.writeFile` usa `Blob`/`document` em ambiente
 * browser, mesmo requisito de `downloadCsv`/`downloadJson`).
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName: string = "Dados",
): void {
  const workbook = buildWorkbook([{ name: sheetName, rows: data }]);
  XLSX.writeFile(workbook, filename);
}

/**
 * Exporta múltiplas tabelas num único `.xlsx`, uma aba por tabela — usado
 * pelo botão "Exportar tudo" da tela de Exportação (Fase 9).
 */
export function exportWorkbookToExcel(filename: string, sheets: ExcelSheet[]): void {
  const workbook = buildWorkbook(sheets);
  XLSX.writeFile(workbook, filename);
}
