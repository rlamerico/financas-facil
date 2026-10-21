"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteCompany, type Company } from "@/hooks/use-companies";
import { CompanyForm } from "./company-form";
import { CompanyRow } from "./company-row";
import { useBusinessContext } from "./business-context";

type FormState = { mode: "create" } | { mode: "edit"; company: Company };

const DELETE_ERROR = "Não foi possível excluir a empresa.";

/** CRUD de empresas do usuário. Usar uma empresa a torna a ativa do módulo. */
export function CompaniesView() {
  const { profileId, companies, activeCompany, setActiveCompanyId } = useBusinessContext();
  const deleteCompany = useDeleteCompany(profileId);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (company: Company) => {
    const confirmed = window.confirm(
      `Excluir a empresa "${company.legal_name}"? Clientes e recebimentos dela também serão apagados.`,
    );
    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    try {
      await deleteCompany.mutateAsync(company.id);
    } catch {
      setDeleteError(DELETE_ERROR);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Suas empresas</h2>
        <Button type="button" onClick={() => setFormState({ mode: "create" })}>
          <Plus className="h-4 w-4" aria-hidden />
          Nova empresa
        </Button>
      </div>

      {deleteError && <p className="mt-2 text-sm text-error">{deleteError}</p>}

      <div className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface shadow-card">
        {companies.length === 0 && (
          <p className="p-4 text-sm text-muted">
            Nenhuma empresa cadastrada. Cadastre sua empresa MEI ou Simples Nacional para começar.
          </p>
        )}
        {companies.map((company) => (
          <CompanyRow
            key={company.id}
            company={company}
            isActive={company.id === activeCompany?.id}
            onUse={() => setActiveCompanyId(company.id)}
            onEdit={() => setFormState({ mode: "edit", company })}
            onDelete={() => handleDelete(company)}
          />
        ))}
      </div>

      {formState && (
        <CompanyForm
          profileId={profileId}
          company={formState.mode === "edit" ? formState.company : null}
          onSaved={(saved) => setActiveCompanyId(saved.id)}
          onClose={() => setFormState(null)}
        />
      )}
    </div>
  );
}
