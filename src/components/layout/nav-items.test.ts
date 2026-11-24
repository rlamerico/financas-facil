import { describe, expect, test } from "vitest";
import { getNavItemsForRole } from "./nav-items";

describe("getNavItemsForRole", () => {
  test("admin vê todos os 13 itens (P02-P14)", () => {
    const items = getNavItemsForRole("admin");

    expect(items).toHaveLength(13);
    expect(items.map((item) => item.id)).toContain("P08");
    expect(items.map((item) => item.id)).toContain("P12");
    expect(items.map((item) => item.id)).toContain("P13");
    expect(items.map((item) => item.id)).toContain("P14");
  });

  test("Faturas de Cartão (P14) aponta para /cartoes e está disponível para os três papéis", () => {
    (["admin", "user", "viewer"] as const).forEach((role) => {
      const card = getNavItemsForRole(role).find((item) => item.id === "P14");

      expect(card?.href).toBe("/cartoes");
      expect(card?.label).toBe("Faturas de Cartão");
    });
  });

  test("user não vê Painel n8n nem Configurações de Sistema", () => {
    const items = getNavItemsForRole("user");
    const labels = items.map((item) => item.label);

    expect(labels).not.toContain("Painel n8n");
    expect(labels).not.toContain("Configurações de Sistema");
  });

  test("viewer não vê Painel n8n nem Configurações de Sistema", () => {
    const items = getNavItemsForRole("viewer");
    const labels = items.map((item) => item.label);

    expect(labels).not.toContain("Painel n8n");
    expect(labels).not.toContain("Configurações de Sistema");
  });

  test("Dashboard está disponível para os três papéis", () => {
    (["admin", "user", "viewer"] as const).forEach((role) => {
      const items = getNavItemsForRole(role);
      expect(items.some((item) => item.id === "P02")).toBe(true);
    });
  });
});
