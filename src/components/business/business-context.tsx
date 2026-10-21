"use client";

import { createContext, useContext } from "react";
import type { Company } from "@/hooks/use-companies";

export interface BusinessContextValue {
  profileId: string;
  companies: Company[];
  activeCompany: Company | null;
  setActiveCompanyId: (companyId: string) => void;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export const BusinessProvider = BusinessContext.Provider;

export function useBusinessContext(): BusinessContextValue {
  const value = useContext(BusinessContext);

  if (!value) {
    throw new Error("useBusinessContext deve ser usado dentro de BusinessShell.");
  }

  return value;
}
