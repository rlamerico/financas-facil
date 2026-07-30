/**
 * Iniciais para o avatar do usuário: primeira letra do primeiro e do último
 * nome ("Ana Maria da Silva" → "AS"). Fallback "?" quando não há nome.
 */
export function getInitials(fullName: string | null | undefined): string {
  const words = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];

  if (words.length === 0) {
    return "?";
  }

  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : "";

  return `${first}${last}`.toUpperCase();
}
