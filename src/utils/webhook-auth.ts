import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Compara o segredo recebido num webhook com o esperado de forma segura
 * contra timing attacks. `crypto.timingSafeEqual` exige buffers do MESMO
 * tamanho (lança exceção se não bater) — em vez de checar o tamanho antes
 * (o que já vazaria informação por timing), comparamos o hash SHA-256 dos
 * dois valores, que sempre tem 32 bytes.
 *
 * Compartilhado pelos receptores de webhook (n8n e sheet-sync).
 */
export function isWebhookSecretValid(
  receivedSecret: string | null,
  expectedSecret: string | undefined,
): boolean {
  if (!expectedSecret || !receivedSecret) {
    return false;
  }

  const expectedHash = createHash("sha256").update(expectedSecret).digest();
  const receivedHash = createHash("sha256").update(receivedSecret).digest();

  return timingSafeEqual(expectedHash, receivedHash);
}
