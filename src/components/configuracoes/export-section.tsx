"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/use-transactions";
import { useAllBudgets } from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";
import { useInvestments } from "@/hooks/use-investments";
import { useBankAccounts } from "@/hooks/use-bank-accounts";
import {
  downloadCsv,
  downloadJson,
  exportToExcel,
  exportWorkbookToExcel,
  type ExcelSheet,
} from "@/utils/export";

interface ExportSectionProps {
  profileId: string;
}

type TableKey = "transactions" | "budgets" | "categories" | "investments" | "bankAccounts";
type ExportFormat = "json" | "csv" | "excel";

const TABLE_LABEL: Record<TableKey, string> = {
  transactions: "Transações",
  budgets: "Orçamentos",
  categories: "Categorias",
  investments: "Investimentos",
  bankAccounts: "Contas Bancárias",
};

const FORMAT_LABEL: Record<ExportFormat, string> = {
  json: "JSON",
  csv: "CSV",
  excel: "Excel",
};

const FORMAT_EXTENSION: Record<ExportFormat, string> = {
  json: "json",
  csv: "csv",
  excel: "xlsx",
};

/**
 * `useTransactions` é paginado (`useInfiniteQuery`, 20 por página por
 * padrão — Fase 2). Pra exportação queremos "tudo numa página só", mesma
 * técnica já usada em `reports-view.tsx` (`HISTORY_PAGE_SIZE`): um
 * `pageSize` generoso em vez de paginar de verdade. Perfil de uso é pessoal/
 * pequena empresa (não um banco processando milhões de lançamentos), então
 * uma única página de 5000 cobre o caso real com folga.
 */
const EXPORT_TRANSACTIONS_PAGE_SIZE = 5000;

function buildFilename(base: string, format: ExportFormat): string {
  const today = new Date().toISOString().slice(0, 10);
  return `financas-facil-${base}-${today}.${FORMAT_EXTENSION[format]}`;
}

/**
 * Exportação de Dados (módulo 9, Fase 9). Botões pra baixar cada tabela do
 * usuário logado (Transações/Orçamentos/Categorias/Investimentos/Contas
 * Bancárias) em JSON, CSV ou Excel, mais um "Exportar tudo" que gera um
 * único `.xlsx` com uma aba por tabela (`exportWorkbookToExcel`).
 *
 * Reusa os hooks de leitura já existentes (Fases 2-6) — a única exceção é
 * `useAllBudgets` (novo em `use-budgets.ts`, Fase 9): o `useBudgets`
 * original só busca metas de um mês/ano por vez (uso do Planejamento
 * Mensal), incompatível com "exportar todo o histórico de metas".
 *
 * `bank_accounts` não estava na lista original do PRD pra este módulo, mas
 * pertence ao mesmo usuário e já existe desde a Fase 6 — incluída aqui
 * porque excluir uma tabela de dados do próprio usuário de um recurso de
 * "exportar meus dados" seria uma omissão, não uma simplificação.
 */
export function ExportSection({ profileId }: ExportSectionProps) {
  const transactionsQuery = useTransactions(profileId, {}, EXPORT_TRANSACTIONS_PAGE_SIZE);
  const budgetsQuery = useAllBudgets(profileId);
  const categoriesQuery = useCategories();
  const investmentsQuery = useInvestments(profileId);
  const bankAccountsQuery = useBankAccounts(profileId);

  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rowsByTable: Record<TableKey, Record<string, unknown>[]> = {
    transactions: (transactionsQuery.data?.pages.flat() ?? []) as unknown as Record<
      string,
      unknown
    >[],
    budgets: (budgetsQuery.data ?? []) as unknown as Record<string, unknown>[],
    categories: (categoriesQuery.data ?? []) as unknown as Record<string, unknown>[],
    investments: (investmentsQuery.data ?? []) as unknown as Record<string, unknown>[],
    bankAccounts: (bankAccountsQuery.data ?? []) as unknown as Record<string, unknown>[],
  };

  const isLoading =
    transactionsQuery.isLoading ||
    budgetsQuery.isLoading ||
    categoriesQuery.isLoading ||
    investmentsQuery.isLoading ||
    bankAccountsQuery.isLoading;

  const isError =
    transactionsQuery.isError ||
    budgetsQuery.isError ||
    categoriesQuery.isError ||
    investmentsQuery.isError ||
    bankAccountsQuery.isError;

  const handleExport = (table: TableKey, format: ExportFormat) => {
    const key = `${table}-${format}`;
    setErrorMessage(null);
    setPendingKey(key);

    try {
      const rows = rowsByTable[table];
      const filename = buildFilename(table, format);

      if (format === "json") {
        downloadJson(filename, rows);
      } else if (format === "csv") {
        downloadCsv(filename, rows);
      } else {
        exportToExcel(rows, filename, TABLE_LABEL[table]);
      }
    } catch {
      setErrorMessage("Não foi possível gerar o arquivo. Tente novamente.");
    } finally {
      setPendingKey(null);
    }
  };

  const handleExportAll = () => {
    setErrorMessage(null);
    setPendingKey("all");

    try {
      const sheets: ExcelSheet[] = (Object.keys(TABLE_LABEL) as TableKey[]).map((table) => ({
        name: TABLE_LABEL[table],
        rows: rowsByTable[table],
      }));
      exportWorkbookToExcel(buildFilename("todos-os-dados", "excel"), sheets);
    } catch {
      setErrorMessage("Não foi possível gerar o arquivo. Tente novamente.");
    } finally {
      setPendingKey(null);
    }
  };

  if (isError) {
    return (
      <p className="text-sm text-error">
        Não foi possível carregar seus dados para exportação. Recarregue a página.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Baixe uma cópia dos seus dados — útil como backup pessoal ou pra abrir numa
        planilha.
      </p>

      {errorMessage && <p className="text-sm text-error">{errorMessage}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-background p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Exportar tudo</p>
          <p className="text-xs text-muted">
            Um único arquivo Excel com uma aba por tabela.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleExportAll}
          disabled={isLoading || pendingKey === "all"}
        >
          <Download className="size-4" aria-hidden="true" />
          {pendingKey === "all" ? "Gerando..." : "Exportar tudo (.xlsx)"}
        </Button>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border bg-surface shadow-card">
        {(Object.keys(TABLE_LABEL) as TableKey[]).map((table) => (
          <div
            key={table}
            className="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{TABLE_LABEL[table]}</p>
              <p className="text-xs text-muted">
                {isLoading ? "Carregando..." : `${rowsByTable[table].length} registro(s)`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(FORMAT_LABEL) as ExportFormat[]).map((format) => (
                <Button
                  key={format}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading || pendingKey === `${table}-${format}`}
                  onClick={() => handleExport(table, format)}
                >
                  {FORMAT_LABEL[format]}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
