"use client";

import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/format";
import { useIntegrationLogs } from "@/hooks/use-integration-logs";

interface LogListProps {
  profileId: string;
}

const STATUS_LABEL: Record<string, string> = {
  success: "Sucesso",
  error: "Erro",
  unauthorized: "Não autorizado",
};

function statusBadgeClass(status: string | null): string {
  if (status === "success") {
    return "bg-success/10 text-success";
  }
  if (status === "unauthorized" || status === "error") {
    return "bg-error/10 text-error";
  }
  return "bg-muted/10 text-muted";
}

/**
 * Painel n8n (P08, admin-only): lista os eventos mais recentes recebidos
 * pelo webhook receptor (`/api/webhooks/n8n`) — sucesso, erro ou tentativa
 * não autorizada, com o payload bruto pra depuração. Somente leitura, sem
 * CRUD — os registros são criados pelo próprio Route Handler do webhook.
 */
export function LogList({ profileId }: LogListProps) {
  const { data: logs, isLoading, isError } = useIntegrationLogs(profileId);

  if (isLoading) {
    return <p className="p-4 text-sm text-muted">Carregando eventos...</p>;
  }

  if (isError) {
    return (
      <p className="p-4 text-sm text-error">
        Não foi possível carregar os eventos de integração.
      </p>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface shadow-card p-4 text-sm text-muted">
        Nenhum evento de integração ainda.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-surface shadow-card">
      {logs.map((log) => (
        <div key={log.id} className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {log.source}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  statusBadgeClass(log.status),
                )}
              >
                {log.status ? (STATUS_LABEL[log.status] ?? log.status) : "—"}
              </span>
            </div>
            <span className="text-xs text-muted">
              {log.executed_at ? formatDateTime(log.executed_at) : "—"}
            </span>
          </div>

          {log.payload != null && (
            <pre className="mt-2 overflow-x-auto rounded-[var(--radius)] bg-background p-3 text-xs text-muted">
              {JSON.stringify(log.payload, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
