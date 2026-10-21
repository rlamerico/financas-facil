"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { accountingFileName } from "@/utils/business/accounting-file-name";
import type { AccountingRow } from "@/utils/business/accounting-export";
import { downloadCsv, exportToExcel } from "@/utils/export";

interface AccountingExportButtonsProps {
  rows: AccountingRow[];
  cnpj: string;
  month: string;
  disabled: boolean;
}

const SHEET_NAME = "Recebimentos";

/** Baixa a mesma prévia mostrada na tela, em CSV (pt-BR) ou Excel. */
export function AccountingExportButtons({ rows, cnpj, month, disabled }: AccountingExportButtonsProps) {
  const handleCsv = () => downloadCsv(accountingFileName(cnpj, month, "csv"), rows);
  const handleExcel = () => exportToExcel(rows, accountingFileName(cnpj, month, "xlsx"), SHEET_NAME);

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={handleCsv} disabled={disabled}>
        <Download className="h-4 w-4" aria-hidden />
        Baixar CSV
      </Button>
      <Button type="button" variant="outline" onClick={handleExcel} disabled={disabled}>
        <FileSpreadsheet className="h-4 w-4" aria-hidden />
        Baixar Excel
      </Button>
    </div>
  );
}
