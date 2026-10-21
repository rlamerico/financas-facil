"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { useActiveCompany } from "@/hooks/use-active-company";
import { useCompanies } from "@/hooks/use-companies";
import { cn } from "@/utils/cn";
import { BusinessProvider } from "./business-context";
import { CompanySwitcher } from "./company-switcher";

const ROOT_PATH = "/empresa";

const BUSINESS_TABS = [
  { href: ROOT_PATH, label: "Empresas" },
  { href: `${ROOT_PATH}/clientes`, label: "Clientes" },
  { href: `${ROOT_PATH}/recebimentos`, label: "Recebimentos" },
  { href: `${ROOT_PATH}/contabilidade`, label: "Contabilidade" },
] as const;

interface BusinessShellProps {
  profileId: string;
  children: ReactNode;
}

/**
 * Cabeçalho do módulo Empresas: seletor de empresa ativa, abas e estado vazio.
 * Sem empresa cadastrada, as abas de dados mostram o convite para cadastrar.
 */
export function BusinessShell({ profileId, children }: BusinessShellProps) {
  const pathname = usePathname();
  const { data: companies = [], isLoading, isError } = useCompanies(profileId);
  const companyIds = useMemo(() => companies.map((company) => company.id), [companies]);
  const { activeCompanyId, setActiveCompanyId } = useActiveCompany(companyIds);
  const activeCompany = companies.find((company) => company.id === activeCompanyId) ?? null;
  const hasCompanies = companies.length > 0;
  const isRootPage = pathname === ROOT_PATH;

  return (
    <BusinessProvider value={{ profileId, companies, activeCompany, setActiveCompanyId }}>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Empresa</h1>
          {hasCompanies && (
            <CompanySwitcher
              companies={companies}
              activeCompanyId={activeCompanyId}
              onChange={setActiveCompanyId}
            />
          )}
        </div>

        <nav
          aria-label="Seções da empresa"
          className="mt-4 flex gap-1 overflow-x-auto border-b border-border"
        >
          {BUSINESS_TABS.map((tab) => {
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6">
          {isLoading && <p className="text-sm text-muted">Carregando empresas...</p>}
          {isError && (
            <p className="text-sm text-error">Não foi possível carregar as empresas.</p>
          )}
          {!isLoading && !isError && !hasCompanies && !isRootPage && (
            <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
              <p className="text-sm text-muted">
                Cadastre sua empresa (MEI ou Simples Nacional) para usar esta seção.
              </p>
              <Link
                href={ROOT_PATH}
                className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
              >
                Cadastrar empresa
              </Link>
            </div>
          )}
          {!isLoading && !isError && (hasCompanies || isRootPage) && children}
        </div>
      </div>
    </BusinessProvider>
  );
}
