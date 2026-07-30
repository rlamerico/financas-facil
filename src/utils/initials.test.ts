import { describe, expect, test } from "vitest";
import { getInitials } from "./initials";

describe("getInitials", () => {
  test("usa primeira letra do primeiro e do último nome", () => {
    expect(getInitials("Rodrigo Americo")).toBe("RA");
  });

  test("nome único vira uma letra só", () => {
    expect(getInitials("Rodrigo")).toBe("R");
  });

  test("ignora espaços extras e nomes do meio", () => {
    expect(getInitials("  Ana  Maria da Silva ")).toBe("AS");
  });

  test("converte para maiúsculas", () => {
    expect(getInitials("paula tamara")).toBe("PT");
  });

  test("retorna fallback para null ou string vazia", () => {
    expect(getInitials(null)).toBe("?");
    expect(getInitials("   ")).toBe("?");
  });
});
