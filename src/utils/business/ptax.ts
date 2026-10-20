import { z } from "zod";

const PTAX_BASE_URL =
  "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)";
const PTAX_TIMEOUT_MS = 5_000;
const MAX_LOOKBACK_DAYS = 7;
const ISO_DATE_LENGTH = 10;
const TIMEOUT_ERROR_NAMES = ["TimeoutError", "AbortError"];

export interface PtaxRate {
  buy: number;
  sell: number;
}

export interface PtaxResult extends PtaxRate {
  requestedDate: string;
  effectiveDate: string;
}

export type FetchLike = (
  input: string,
  init?: { signal?: AbortSignal },
) => Promise<Response>;

export class PtaxError extends Error {
  readonly status: 502 | 504;

  constructor(status: 502 | 504, message: string) {
    super(message);
    this.name = "PtaxError";
    this.status = status;
  }
}

const ptaxResponseSchema = z.object({
  value: z.array(
    z.object({
      cotacaoCompra: z.number(),
      cotacaoVenda: z.number(),
      dataHoraCotacao: z.string(),
    }),
  ),
});

/** Converte `YYYY-MM-DD` para `MM-DD-AAAA`, formato exigido pela API do BCB. */
function toBcbDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");

  return `${month}-${day}-${year}`;
}

export function buildPtaxUrl(isoDate: string): string {
  return `${PTAX_BASE_URL}?@dataCotacao='${toBcbDate(isoDate)}'&$format=json`;
}

export function shiftIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, ISO_DATE_LENGTH);
}

/** Retorna compra/venda do primeiro boletim, `null` se a data não tem boletim. */
export function parsePtaxResponse(json: unknown): PtaxRate | null {
  const parsed = ptaxResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new PtaxError(502, "Resposta inválida do Banco Central.");
  }

  const [record] = parsed.data.value;

  if (!record) {
    return null;
  }

  return { buy: record.cotacaoCompra, sell: record.cotacaoVenda };
}

function toPtaxError(error: unknown): PtaxError {
  const isTimeout =
    error instanceof Error && TIMEOUT_ERROR_NAMES.includes(error.name);

  return isTimeout
    ? new PtaxError(504, "O Banco Central demorou para responder.")
    : new PtaxError(502, "Falha ao consultar o Banco Central.");
}

async function requestRate(url: string, fetchImpl: FetchLike): Promise<Response> {
  try {
    return await fetchImpl(url, { signal: AbortSignal.timeout(PTAX_TIMEOUT_MS) });
  } catch (error) {
    throw toPtaxError(error);
  }
}

async function readRateForDate(
  isoDate: string,
  fetchImpl: FetchLike,
): Promise<PtaxRate | null> {
  const response = await requestRate(buildPtaxUrl(isoDate), fetchImpl);

  if (!response.ok) {
    throw new PtaxError(502, `O Banco Central respondeu com status ${response.status}.`);
  }

  const json = await response.json().catch(() => {
    throw new PtaxError(502, "Resposta inválida do Banco Central.");
  });

  return parsePtaxResponse(json);
}

/**
 * Busca a PTAX da data; em fim de semana/feriado (sem boletim) retrocede
 * dia a dia até encontrar o último dia útil, limitado a `MAX_LOOKBACK_DAYS`.
 */
export async function fetchPtaxForDate(
  isoDate: string,
  fetchImpl: FetchLike = fetch,
): Promise<PtaxResult> {
  for (let offset = 0; offset <= MAX_LOOKBACK_DAYS; offset += 1) {
    const candidateDate = shiftIsoDate(isoDate, -offset);
    const rate = await readRateForDate(candidateDate, fetchImpl);

    if (rate) {
      return { requestedDate: isoDate, effectiveDate: candidateDate, ...rate };
    }
  }

  throw new PtaxError(502, "Nenhuma cotação PTAX encontrada nos dias anteriores.");
}
