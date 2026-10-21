"use client";

import { useQuery } from "@tanstack/react-query";
import type { PtaxResult } from "@/utils/business/ptax";

const PTAX_STALE_TIME_MS = 60 * 60 * 1000;
const PTAX_RETRY_COUNT = 1;
const FALLBACK_ERROR_MESSAGE = "Não foi possível consultar a PTAX.";

interface PtaxApiBody {
  success: boolean;
  data?: PtaxResult;
  error?: string;
}

async function fetchPtax(date: string): Promise<PtaxResult> {
  const response = await fetch(`/api/fx/ptax?date=${encodeURIComponent(date)}`);
  const body = (await response.json().catch(() => null)) as PtaxApiBody | null;

  if (!response.ok || !body?.success || !body.data) {
    throw new Error(body?.error ?? FALLBACK_ERROR_MESSAGE);
  }

  return body.data;
}

/** PTAX de referência da data (venda), via Route Handler. Desabilitado sem data. */
export function usePtax(date: string | null) {
  return useQuery({
    queryKey: ["ptax", date],
    queryFn: () => fetchPtax(date ?? ""),
    enabled: Boolean(date),
    staleTime: PTAX_STALE_TIME_MS,
    retry: PTAX_RETRY_COUNT,
  });
}
