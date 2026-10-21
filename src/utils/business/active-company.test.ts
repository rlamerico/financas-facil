import { describe, expect, test } from "vitest";
import { resolveActiveCompanyId } from "./active-company";

const COMPANY_IDS = ["company-a", "company-b"];

describe("resolveActiveCompanyId", () => {
  test("mantém a empresa guardada quando ela ainda existe", () => {
    expect(resolveActiveCompanyId("company-b", COMPANY_IDS)).toBe("company-b");
  });

  test("cai na primeira empresa quando nada foi guardado", () => {
    expect(resolveActiveCompanyId(null, COMPANY_IDS)).toBe("company-a");
  });

  test("cai na primeira empresa quando a guardada foi excluída", () => {
    expect(resolveActiveCompanyId("company-removed", COMPANY_IDS)).toBe(
      "company-a",
    );
  });

  test("retorna nulo quando o usuário não tem empresa", () => {
    expect(resolveActiveCompanyId("company-a", [])).toBeNull();
  });
});
