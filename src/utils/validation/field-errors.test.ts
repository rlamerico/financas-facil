import { describe, expect, test } from "vitest";
import { toFieldErrors } from "./field-errors";

describe("toFieldErrors", () => {
  test("mapeia a primeira mensagem de cada campo", () => {
    const errors = toFieldErrors([
      { path: ["name"], message: "Informe o nome." },
      { path: ["name"], message: "Nome muito curto." },
    ]);

    expect(errors).toEqual({ name: "Informe o nome." });
  });

  test("usa somente o primeiro segmento do caminho como chave", () => {
    const errors = toFieldErrors([{ path: ["document", 0], message: "CNPJ inválido." }]);

    expect(errors).toEqual({ document: "CNPJ inválido." });
  });

  test("retorna objeto vazio sem problemas", () => {
    expect(toFieldErrors([])).toEqual({});
  });
});
