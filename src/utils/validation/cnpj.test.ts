import { describe, expect, test } from "vitest";
import { isValidCnpj, normalizeCnpj } from "./cnpj";

describe("normalizeCnpj", () => {
  test("remove máscara e deixa somente dígitos", () => {
    expect(normalizeCnpj("11.444.777/0001-61")).toBe("11444777000161");
  });

  test("mantém CNPJ já sem máscara", () => {
    expect(normalizeCnpj("11444777000161")).toBe("11444777000161");
  });

  test("remove espaços ao redor", () => {
    expect(normalizeCnpj("  11444777000161 ")).toBe("11444777000161");
  });
});

describe("isValidCnpj", () => {
  test("aceita CNPJ válido sem máscara", () => {
    expect(isValidCnpj("11444777000161")).toBe(true);
  });

  test("aceita CNPJ válido com máscara", () => {
    expect(isValidCnpj("11.444.777/0001-61")).toBe(true);
  });

  test("rejeita dígito verificador errado", () => {
    expect(isValidCnpj("11444777000162")).toBe(false);
  });

  test("rejeita sequência repetida mesmo que dígitos batam", () => {
    expect(isValidCnpj("11111111111111")).toBe(false);
  });

  test("rejeita CNPJ curto", () => {
    expect(isValidCnpj("1234")).toBe(false);
  });

  test("rejeita CNPJ longo", () => {
    expect(isValidCnpj("114447770001611")).toBe(false);
  });

  test("rejeita string vazia", () => {
    expect(isValidCnpj("")).toBe(false);
  });

  test("rejeita letras", () => {
    expect(isValidCnpj("1144477700016A")).toBe(false);
  });
});
