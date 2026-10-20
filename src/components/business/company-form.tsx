"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useCreateCompany,
  useUpdateCompany,
  type Company,
  type CompanyFormInput,
} from "@/hooks/use-companies";
import { REGIME_LABELS } from "@/utils/business/labels";
import { companySchema } from "@/utils/validation/business-schemas";
import { toFieldErrors } from "@/utils/validation/field-errors";

interface CompanyFormProps {
  profileId: string;
  /** `null` = criação; presente = edição. */
  company: Company | null;
  onClose: () => void;
  onSaved: (company: Company) => void;
}

const GENERIC_SAVE_ERROR = "Não foi possível salvar a empresa. Tente novamente.";
const DUPLICATE_CNPJ_ERROR = "Já existe uma empresa com este CNPJ.";
const UNIQUE_VIOLATION_CODE = "23505";
const REGIME_OPTIONS = Object.entries(REGIME_LABELS) as [
  CompanyFormInput["regime"],
  string,
][];
const INPUT_CLASS =
  "mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

/** Cadastro/edição de empresa MEI ou Simples Nacional. Validação pelo `companySchema`. */
export function CompanyForm({ profileId, company, onClose, onSaved }: CompanyFormProps) {
  const isEditing = Boolean(company);
  const [legalName, setLegalName] = useState(company?.legal_name ?? "");
  const [tradeName, setTradeName] = useState(company?.trade_name ?? "");
  const [cnpj, setCnpj] = useState(company?.cnpj ?? "");
  const [regime, setRegime] = useState<CompanyFormInput["regime"]>(
    (company?.regime as CompanyFormInput["regime"]) ?? "mei",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createCompany = useCreateCompany(profileId);
  const updateCompany = useUpdateCompany(profileId);
  const isSaving = createCompany.isPending || updateCompany.isPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input: CompanyFormInput = {
      legal_name: legalName,
      trade_name: tradeName.trim() === "" ? null : tradeName,
      cnpj,
      regime,
    };

    const result = companySchema.safeParse(input);
    if (!result.success) {
      setErrors(toFieldErrors(result.error.issues));
      return;
    }

    setErrors({});

    try {
      const saved =
        isEditing && company
          ? await updateCompany.mutateAsync({ id: company.id, ...input })
          : await createCompany.mutateAsync(input);
      onSaved(saved);
      onClose();
    } catch (error) {
      setErrors({ form: toSaveErrorMessage(error) });
    }
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-surface p-6 shadow-overlay animate-fade-up">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              {isEditing ? "Editar empresa" : "Nova empresa"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="text-muted hover:text-foreground" aria-label="Fechar">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="company-legal-name" className="text-sm font-medium">
                Razão social
              </label>
              <input
                id="company-legal-name"
                value={legalName}
                onChange={(event) => setLegalName(event.target.value)}
                className={INPUT_CLASS}
              />
              {errors.legal_name && <p className="mt-1 text-xs text-error">{errors.legal_name}</p>}
            </div>

            <div>
              <label htmlFor="company-trade-name" className="text-sm font-medium">
                Nome fantasia (opcional)
              </label>
              <input
                id="company-trade-name"
                value={tradeName}
                onChange={(event) => setTradeName(event.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="company-cnpj" className="text-sm font-medium">
                CNPJ
              </label>
              <input
                id="company-cnpj"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(event) => setCnpj(event.target.value)}
                className={INPUT_CLASS}
              />
              {errors.cnpj && <p className="mt-1 text-xs text-error">{errors.cnpj}</p>}
            </div>

            <div>
              <label htmlFor="company-regime" className="text-sm font-medium">
                Regime tributário
              </label>
              <select
                id="company-regime"
                value={regime}
                onChange={(event) => setRegime(event.target.value as CompanyFormInput["regime"])}
                className={INPUT_CLASS}
              >
                {REGIME_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.regime && <p className="mt-1 text-xs text-error">{errors.regime}</p>}
            </div>

            {errors.form && <p className="text-sm text-error">{errors.form}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function toSaveErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : null;

  return code === UNIQUE_VIOLATION_CODE ? DUPLICATE_CNPJ_ERROR : GENERIC_SAVE_ERROR;
}
