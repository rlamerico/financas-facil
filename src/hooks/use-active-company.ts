"use client";

import { useCallback, useState } from "react";
import { resolveActiveCompanyId } from "@/utils/business/active-company";

const ACTIVE_COMPANY_STORAGE_KEY = "financas-facil:active-company";

function readStoredCompanyId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredCompanyId(companyId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, companyId);
  } catch {
    // Armazenamento indisponível (janela privada, dados bloqueados): a escolha vale só nesta sessão.
  }
}

/**
 * Empresa ativa do módulo. Usa a guardada no navegador se ela ainda existir,
 * senão a primeira da lista. Funciona sem `localStorage`.
 */
export function useActiveCompany(companyIds: readonly string[]) {
  const [storedId, setStoredId] = useState<string | null>(readStoredCompanyId);

  const setActiveCompanyId = useCallback((companyId: string) => {
    writeStoredCompanyId(companyId);
    setStoredId(companyId);
  }, []);

  return {
    activeCompanyId: resolveActiveCompanyId(storedId, companyIds),
    setActiveCompanyId,
  };
}
