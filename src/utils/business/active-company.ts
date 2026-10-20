/**
 * Empresa ativa: mantém a escolhida se ela ainda existe, senão cai na primeira
 * da lista. Retorna `null` quando o usuário não tem nenhuma empresa.
 */
export function resolveActiveCompanyId(
  storedId: string | null,
  companyIds: readonly string[],
): string | null {
  if (storedId !== null && companyIds.includes(storedId)) {
    return storedId;
  }

  return companyIds[0] ?? null;
}
