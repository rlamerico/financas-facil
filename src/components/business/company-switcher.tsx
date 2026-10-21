"use client";

import type { Company } from "@/hooks/use-companies";

interface CompanySwitcherProps {
  companies: Company[];
  activeCompanyId: string | null;
  onChange: (companyId: string) => void;
}

/** Seletor da empresa ativa usado no cabeçalho do módulo Empresas. */
export function CompanySwitcher({ companies, activeCompanyId, onChange }: CompanySwitcherProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="company-switcher" className="text-sm text-muted">
        Empresa
      </label>
      <select
        id="company-switcher"
        value={activeCompanyId ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.trade_name ?? company.legal_name}
          </option>
        ))}
      </select>
    </div>
  );
}
