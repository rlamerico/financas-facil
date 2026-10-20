"use client";

import { useMemo, useState } from "react";
import { useBusinessClients, type BusinessClient } from "@/hooks/use-business-clients";
import { useBusinessReceipts } from "@/hooks/use-business-receipts";
import {
  ACCOUNTING_COLUMNS,
  toAccountingRows,
  type ClientInfo,
} from "@/utils/business/accounting-export";
import { toOrigin, toReceiptRow } from "@/utils/business/receipt-mappers";
import { formatMonthKey } from "@/utils/business/month-range";
import { formatRate, formatUsd } from "@/utils/business/money-format";
import { summarizeReceipts } from "@/utils/business/receipts-summary";
import { formatCurrency } from "@/utils/format";
import { useBusinessContext } from "./business-context";
import { AccountingExportButtons } from "./accounting-export-buttons";

const TOTAL_ROW_LABEL = "Total";

function previousMonthKey(now: Date): string {
  return formatMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
}

function toClientInfoById(clients: BusinessClient[]): Record<string, ClientInfo> {
  return Object.fromEntries(
    clients.map((client) => [client.id, { id: client.id, name: client.name, origin: toOrigin(client) }]),
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

/** Prévia mensal dos recebimentos para o contador, com as mesmas linhas do arquivo exportado. */
export function AccountingView() {
  const { activeCompany } = useBusinessContext();
  const companyId = activeCompany?.id ?? "";
  const [month, setMonth] = useState(() => previousMonthKey(new Date()));

  const clientsQuery = useBusinessClients(companyId);
  const receiptsQuery = useBusinessReceipts(companyId, { month });
  const isReady = clientsQuery.isSuccess && receiptsQuery.isSuccess;

  const receipts = useMemo(
    () => (receiptsQuery.data ?? []).map(toReceiptRow),
    [receiptsQuery.data],
  );

  const rows = useMemo(
    () => (isReady ? toAccountingRows(receipts, toClientInfoById(clientsQuery.data ?? [])) : []),
    [isReady, receipts, clientsQuery.data],
  );

  const summary = useMemo(() => summarizeReceipts(receipts, { month }), [receipts, month]);

  const receivedCount = receipts.filter((receipt) => receipt.status === "received").length;
  const usdWithoutPtaxCount = receipts.filter(
    (receipt) => receipt.status === "received" && receipt.currency === "USD" && receipt.ptax_rate === null,
  ).length;
  const hasRows = rows.length > 0;

  const isLoading = !isReady && !clientsQuery.isError && !receiptsQuery.isError;
  const hasError = clientsQuery.isError || receiptsQuery.isError;

  return (
    <div>
      <p className="text-sm text-muted">
        Recebimentos do mês com data, valor em dólar, cotação e valor em reais, prontos para o contador.
      </p>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <label htmlFor="accounting-month" className="text-xs font-medium text-muted">
            Mês de referência
          </label>
          <input
            id="accounting-month"
            type="month"
            value={month}
            onChange={(event) => event.target.value && setMonth(event.target.value)}
            className="mt-1 block rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <AccountingExportButtons
          rows={rows}
          cnpj={activeCompany?.cnpj ?? ""}
          month={month}
          disabled={!hasRows || !activeCompany}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Total em BRL" value={formatCurrency(summary.totalBrl)} />
        <SummaryCard label="Total em USD" value={formatUsd(summary.totalUsd)} />
        <SummaryCard
          label="Cotação média"
          value={summary.weightedAvgRate === null ? "—" : formatRate(summary.weightedAvgRate)}
        />
        <SummaryCard label="Recebimentos" value={String(receivedCount)} />
      </div>

      {usdWithoutPtaxCount > 0 && (
        <p className="mt-3 text-xs text-muted">
          {usdWithoutPtaxCount} recebimento(s) em USD sem PTAX de referência (informativo).
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface shadow-card">
        {isLoading && <p className="p-4 text-sm text-muted">Carregando recebimentos...</p>}
        {hasError && <p className="p-4 text-sm text-error">Não foi possível carregar os dados do mês.</p>}
        {isReady && !hasRows && <p className="p-4 text-sm text-muted">Nenhum recebimento neste mês.</p>}
        {hasRows && (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-background text-left text-xs font-semibold text-muted">
              <tr>
                {ACCOUNTING_COLUMNS.map((column) => (
                  <th key={column} className="px-3 py-2">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, index) => {
                const isTotal = row.Cliente === TOTAL_ROW_LABEL;

                return (
                  <tr key={`${row.Data}-${index}`} className={isTotal ? "font-semibold" : undefined}>
                    {ACCOUNTING_COLUMNS.map((column) => (
                      <td key={column} className="px-3 py-2 tabular-nums">
                        {row[column]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
