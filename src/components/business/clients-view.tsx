"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useBusinessClients,
  useDeleteBusinessClient,
  type BusinessClient,
} from "@/hooks/use-business-clients";
import type { BusinessClientFormInput } from "@/hooks/use-business-clients";
import { useBusinessContext } from "./business-context";
import { ClientForm } from "./client-form";
import { ClientRow } from "./client-row";

type ClientOrigin = BusinessClientFormInput["origin"];

interface FormState {
  client: BusinessClient | null;
  defaultOrigin: ClientOrigin;
}

const FOREIGN_KEY_VIOLATION_CODE = "23503";
const HAS_RECEIPTS_ERROR = "Este cliente tem recebimentos e não pode ser excluído.";
const DELETE_ERROR = "Não foi possível excluir o cliente.";

function toDeleteErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : null;

  return code === FOREIGN_KEY_VIOLATION_CODE ? HAS_RECEIPTS_ERROR : DELETE_ERROR;
}

/** Clientes da empresa ativa, separados em Brasil (BRL) e Exterior (USD). */
export function ClientsView() {
  const { activeCompany } = useBusinessContext();
  const companyId = activeCompany?.id ?? "";
  const { data: clients = [], isLoading, isError } = useBusinessClients(companyId);
  const deleteClient = useDeleteBusinessClient(companyId);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const domesticClients = clients.filter((client) => client.origin === "domestic");
  const foreignClients = clients.filter((client) => client.origin === "foreign");

  const handleDelete = async (client: BusinessClient) => {
    const confirmed = window.confirm(`Excluir o cliente "${client.name}"?`);
    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    try {
      await deleteClient.mutateAsync(client.id);
    } catch (error) {
      setDeleteError(toDeleteErrorMessage(error));
    }
  };

  const openForm = (client: BusinessClient | null, defaultOrigin: ClientOrigin) =>
    setFormState({ client, defaultOrigin });

  const renderSection = (
    title: string,
    origin: ClientOrigin,
    sectionClients: BusinessClient[],
  ) => (
    <section className="mt-8 first:mt-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {title} <span className="text-sm font-normal text-muted">({sectionClients.length})</span>
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={() => openForm(null, origin)}>
          <Plus className="h-4 w-4" aria-hidden />
          Novo cliente
        </Button>
      </div>

      <div className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface shadow-card">
        {sectionClients.length === 0 && (
          <p className="p-4 text-sm text-muted">Nenhum cliente cadastrado nesta seção.</p>
        )}
        {sectionClients.map((client) => (
          <ClientRow
            key={client.id}
            client={client}
            onEdit={() => openForm(client, origin)}
            onDelete={() => handleDelete(client)}
          />
        ))}
      </div>
    </section>
  );

  return (
    <div>
      {isLoading && <p className="text-sm text-muted">Carregando clientes...</p>}
      {isError && <p className="text-sm text-error">Não foi possível carregar os clientes.</p>}
      {deleteError && <p className="mb-4 text-sm text-error">{deleteError}</p>}

      {!isLoading && !isError && (
        <>
          {renderSection("Clientes do Brasil (BRL)", "domestic", domesticClients)}
          {renderSection("Clientes do exterior (USD)", "foreign", foreignClients)}
        </>
      )}

      {formState && (
        <ClientForm
          companyId={companyId}
          client={formState.client}
          defaultOrigin={formState.defaultOrigin}
          onClose={() => setFormState(null)}
        />
      )}
    </div>
  );
}
