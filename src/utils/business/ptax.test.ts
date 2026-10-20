import { describe, expect, test, vi } from "vitest";
import {
  PtaxError,
  buildPtaxUrl,
  fetchPtaxForDate,
  parsePtaxResponse,
  shiftIsoDate,
} from "./ptax";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const EMPTY_BODY = { value: [] };

const RATE_BODY = {
  value: [
    {
      cotacaoCompra: 5.4,
      cotacaoVenda: 5.41,
      dataHoraCotacao: "2026-10-16 13:06:00.000",
    },
  ],
};

function mockFetch(...responses: Response[]) {
  const fetchMock = vi.fn();

  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }

  return fetchMock;
}

describe("buildPtaxUrl", () => {
  test("monta a URL da CotacaoDolarDia com data no formato MM-DD-AAAA", () => {
    const url = buildPtaxUrl("2026-10-16");

    expect(url).toContain(
      "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia",
    );
    expect(url).toContain("@dataCotacao='10-16-2026'");
    expect(url).toContain("$format=json");
  });
});

describe("shiftIsoDate", () => {
  test("retrocede um dia atravessando o mês", () => {
    expect(shiftIsoDate("2026-10-01", -1)).toBe("2026-09-30");
  });

  test("retrocede vários dias atravessando o ano", () => {
    expect(shiftIsoDate("2026-01-02", -3)).toBe("2025-12-30");
  });
});

describe("parsePtaxResponse", () => {
  test("extrai compra e venda do primeiro registro", () => {
    expect(parsePtaxResponse(RATE_BODY)).toEqual({ buy: 5.4, sell: 5.41 });
  });

  test("retorna null quando não há cotação para a data", () => {
    expect(parsePtaxResponse(EMPTY_BODY)).toBeNull();
  });

  test("lança erro quando o formato da resposta é inválido", () => {
    expect(() => parsePtaxResponse({ foo: "bar" })).toThrow(PtaxError);
  });
});

describe("fetchPtaxForDate", () => {
  test("retorna a cotação da própria data quando há boletim", async () => {
    const fetchMock = mockFetch(jsonResponse(RATE_BODY));

    const result = await fetchPtaxForDate("2026-10-16", fetchMock);

    expect(result).toEqual({
      requestedDate: "2026-10-16",
      effectiveDate: "2026-10-16",
      buy: 5.4,
      sell: 5.41,
    });
  });

  test("usa a URL da data pedida na consulta", async () => {
    const fetchMock = mockFetch(jsonResponse(RATE_BODY));

    await fetchPtaxForDate("2026-10-16", fetchMock);

    expect(String(fetchMock.mock.calls[0][0])).toContain("'10-16-2026'");
  });

  test("retrocede para o último dia útil quando a data não tem boletim", async () => {
    const fetchMock = mockFetch(
      jsonResponse(EMPTY_BODY),
      jsonResponse(EMPTY_BODY),
      jsonResponse(RATE_BODY),
    );

    const result = await fetchPtaxForDate("2026-10-18", fetchMock);

    expect(result.requestedDate).toBe("2026-10-18");
    expect(result.effectiveDate).toBe("2026-10-16");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test("lança erro 502 quando não há cotação em 7 dias", async () => {
    const responses = Array.from({ length: 8 }, () => jsonResponse(EMPTY_BODY));
    const fetchMock = mockFetch(...responses);

    await expect(fetchPtaxForDate("2026-10-18", fetchMock)).rejects.toMatchObject(
      { status: 502 },
    );
  });

  test("lança erro 502 quando a rede falha", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));

    await expect(fetchPtaxForDate("2026-10-16", fetchMock)).rejects.toMatchObject(
      { status: 502 },
    );
  });

  test("lança erro 504 quando a consulta estoura o tempo limite", async () => {
    const timeout = Object.assign(new Error("timeout"), { name: "TimeoutError" });
    const fetchMock = vi.fn().mockRejectedValue(timeout);

    await expect(fetchPtaxForDate("2026-10-16", fetchMock)).rejects.toMatchObject(
      { status: 504 },
    );
  });

  test("lança erro 502 quando o Banco Central responde com falha HTTP", async () => {
    const fetchMock = mockFetch(jsonResponse({}, 500));

    await expect(fetchPtaxForDate("2026-10-16", fetchMock)).rejects.toMatchObject(
      { status: 502 },
    );
  });

  test("lança erro 502 quando a resposta não é JSON válido", async () => {
    const fetchMock = mockFetch(new Response("<html>erro</html>", { status: 200 }));

    await expect(fetchPtaxForDate("2026-10-16", fetchMock)).rejects.toMatchObject(
      { status: 502 },
    );
  });
});
