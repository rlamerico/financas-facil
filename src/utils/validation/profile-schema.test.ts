import { describe, expect, test } from "vitest";
import { profileSchema, avatarFileSchema, ROLE_OPTIONS } from "./profile-schema";

function makeFile(name: string, type: string, sizeBytes: number): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

describe("profileSchema", () => {
  test("aceita nome válido", () => {
    expect(profileSchema.safeParse({ full_name: "Maria Silva" }).success).toBe(true);
  });

  test("remove espaços em branco nas pontas", () => {
    const result = profileSchema.safeParse({ full_name: "  Maria Silva  " });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.full_name).toBe("Maria Silva");
    }
  });

  test("rejeita nome vazio", () => {
    expect(profileSchema.safeParse({ full_name: "" }).success).toBe(false);
  });

  test("rejeita nome só com espaços", () => {
    expect(profileSchema.safeParse({ full_name: "   " }).success).toBe(false);
  });
});

describe("avatarFileSchema", () => {
  test("aceita PNG dentro do limite de tamanho", () => {
    const file = makeFile("avatar.png", "image/png", 1024);

    expect(avatarFileSchema.safeParse(file).success).toBe(true);
  });

  test("aceita JPEG e WebP", () => {
    expect(avatarFileSchema.safeParse(makeFile("a.jpg", "image/jpeg", 1024)).success).toBe(true);
    expect(avatarFileSchema.safeParse(makeFile("a.webp", "image/webp", 1024)).success).toBe(true);
  });

  test("rejeita tipo de arquivo não suportado", () => {
    const file = makeFile("doc.pdf", "application/pdf", 1024);

    expect(avatarFileSchema.safeParse(file).success).toBe(false);
  });

  test("rejeita arquivo maior que 5MB", () => {
    const file = makeFile("avatar.png", "image/png", 6 * 1024 * 1024);

    expect(avatarFileSchema.safeParse(file).success).toBe(false);
  });
});

describe("ROLE_OPTIONS", () => {
  test("contém exatamente os três papéis do RBAC", () => {
    expect(ROLE_OPTIONS).toEqual(["admin", "user", "viewer"]);
  });
});
