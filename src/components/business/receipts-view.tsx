"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useBusinessClients,
  type BusinessClient,
} from "@/hooks/use-business-clients";
import {
  useBusinessReceipts,
  useDeleteBusinessReceipt,
  type BusinessReceipt,
} from "@/hooks/use-business-receipts";
import { filterReceipts, type ReceiptOrigin } from "@/utils/business/receipt-filters";
import { formatMonthKey } from "@/utils/business/month-range";
import { formatRate, formatUsd } from "@/utils/business/money-format";
import { summarizeReceipts, type ReceiptRow } from "@/utils/business/receipts-summary";
import { formatCurrency } from "@/utils/format";
import { useBusinessContext } from "./business-context";
import { ReceiptForm } from "./receipt-form";
import { ReceiptRow as ReceiptListRow } from "./receipt-row";

const DELETE_ERROR = "Não foi possível excluir o recebimento.";

function toReceiptRow(receipt: BusinessReceipt): ReceiptRow {
  return {
    id: receipt.id,
    client_id: receipt.client_id,
    received_on: receipt.received_on,
    currency: receipt.currency === "USD" ? "USD" : "BRL",
    amount_original: receipt.amount_original,
    exchange_rate: receipt.exchange_rate,
    ptax_rate: receipt.ptax_rate,
    amount_brl: receipt.amount_brl,
    invoice_ref: receipt.invoice_ref,
    status: receipt.status === "expected" ? "expected" : "received",
  };
}

function toOrigin(client: BusinessClient): ReceiptOrigin {
  return client.origin === "foreign" ? "foreign" : "domestic";
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

/** Recebimentos da empresa ativa com filtros por mês, cliente e origem, e totais do mês. */
export function ReceiptsView() {
  const { activeCompany } = useBusinessContext();
  const companyId = activeCompany?.id ?? "";
  const [month, setMonth] = useState(() => formatMonthKey(new Date()));
  const [clientFilter, setClientFilter] = useState("");
  const [originFilter, setOriginFilter] = useState<"" | ReceiptOrigin>("");
  const [formState, setFormState] = useState<{ receipt: BusinessReceipt | null } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: clients = [] } = useBusinessClients(companyId);
  const { data: receipts = [], isLoading, isError } = useBusinessReceipts(companyId, { month });
  const deleteReceipt = useDeleteBusinessReceipt(companyId);

  const clientsById = useMemo(
    () => Object.fromEntries(clients.map((client) => [client.id, client])),
    [clients],
  );
  const originByClient = useMemo(
    () => Object.fromEntries(clients.map((client) => [client.id, toOrigin(client)])),
    [clients],
  );

  const visibleReceipts = useMemo(
    () =>
      filterReceipts(
        receipts,
        { clientId: clientFilter || null, origin: originFilter || null },
        originByClient,
      ),
    [receipts, clientFilter, originFilter, originByClient],
  );

  const summary = useMemo(
    () => summarizeReceipts(visibleReceipts.map(toReceiptRow), { month }),
    [visibleReceipts, month],
  );

  const handleDelete = async (receipt: BusinessReceipt) => {
    const confirmed = window.confirm("Excluir este recebimento?");
    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    try {
      await deleteReceipt.mutateAsync(receipt.id);
    } catch {
      setDeleteError(DELETE_ERROR);
    }
  };

  if (!isLoading && !isError && clients.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
        <p className="text-sm text-muted">Cadastre um cliente antes de registrar recebimentos.</p>
        <Link href="/empresa/clientes" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          Ir para clientes
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Total em BRL" value={formatCurrency(summary.totalBrl)} />
        <SummaryCard label="Total em USD" value={formatUsd(summary.totalUsd)} />
        <SummaryCard
          label="Cotação média"
          value={summary.weightedAvgRate === null ? "—" : formatRate(summary.weightedAvgRate)}
        />
        <SummaryCard label="Recebimentos" value={String(visibleReceipts.length)} />
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div>
            <label htmlFor="receipts-month" className="text-xs font-medium text-muted">
              Mês
            </label>
            <input
              id="receipts-month"
              type="month"
              value={month}
              onChange={(event) => event.target.value && setMonth(event.target.value)}
              className="mt-1 block rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="receipts-client-filter" className="text-xs font-medium text-muted">
              Cliente
            </label>
            <select
              id="receipts-client-filter"
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
              className="mt-1 block rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="receipts-origin-filter" className="text-xs font-medium text-muted">
              Origem
            </label>
            <select
              id="receipts-origin-filter"
              value={originFilter}
              onChange={(event) => setOriginFilter(event.target.value as "" | ReceiptOrigin)}
              className="mt-1 block rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              <option value="domestic">Brasil</option>
              <option value="foreign">Exterior</option>
            </select>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setFormState({ receipt: null })}
          disabled={clients.length === 0}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Novo recebimento
        </Button>
      </div>

      {deleteError && <p className="mt-3 text-sm text-error">{deleteError}</p>}

      <div className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface shadow-card">
        {isLoading && <p className="p-4 text-sm text-muted">Carregando recebimentos...</p>}
        {isError && <p className="p-4 text-sm text-error">Não foi possível carregar os recebimentos.</p>}
        {!isLoading && !isError && visibleReceipts.length === 0 && (
          <p className="p-4 text-sm text-muted">Nenhum recebimento neste filtro.</p>
        )}
        {visibleReceipts.map((receipt) => (
          <ReceiptListRow
            key={receipt.id}
            receipt={receipt}
            clientName={clientsById[receipt.client_id]?.name ?? "Cliente removido"}
            onEdit={() => setFormState({ receipt })}
            onDelete={() => handleDelete(receipt)}
          />
        ))}
      </div>

      {formState && (
        <ReceiptForm
          companyId={companyId}
          clients={clients}
          receipt={formState.receipt}
          onClose={() => setFormState(null)}
        />
      )}
    </div>
  );
}
