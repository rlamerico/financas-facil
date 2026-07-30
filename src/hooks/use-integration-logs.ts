"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/services/supabase/client";
import type { Tables } from "@/types/database";

export type IntegrationLog = Tables<"integrations_log">;

const LOGS_LIMIT = 50;

function integrationLogsQueryKey(profileId: string) {
  return ["integration-logs", profileId] as const;
}

async function fetchIntegrationLogs(profileId: string): Promise<IntegrationLog[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("integrations_log")
    .select("*")
    .or(`profile_id.eq.${profileId},profile_id.is.null`)
    .order("executed_at", { ascending: false })
    .limit(LOGS_LIMIT);

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Lista os eventos de integração mais recentes (webhook do n8n) — próprios
 * do perfil ou globais (`profile_id IS NULL`), mesma regra da policy de
 * SELECT em `integrations_log`. Painel só de leitura (P08, admin-only) —
 * sem Realtime nesta fase: eventos de integração não são frequentes o
 * suficiente pra justificar a assinatura, e um refresh manual/reload já
 * resolve; pode virar Realtime depois se o volume justificar.
 */
export function useIntegrationLogs(profileId: string) {
  return useQuery({
    queryKey: integrationLogsQueryKey(profileId),
    queryFn: () => fetchIntegrationLogs(profileId),
    enabled: Boolean(profileId),
  });
}
