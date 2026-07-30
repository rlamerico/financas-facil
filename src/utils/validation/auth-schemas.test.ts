import { describe, expect, test } from "vitest";
import { loginSchema, signupSchema } from "./auth-schemas";

describe("loginSchema", () => {
  test("aceita e-mail e senha válidos", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "senha123",
    });

    expect(result.success).toBe(true);
  });

  test("rejeita e-mail inválido", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "senha123",
    });

    expect(result.success).toBe(false);
  });

  test("rejeita senha vazia", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  const validInput = {
    fullName: "Rodrigo Americo",
    email: "user@example.com",
    password: "senha1234",
    confirmPassword: "senha1234",
  };

  test("aceita dados válidos", () => {
    const result = signupSchema.safeParse(validInput);

    expect(result.success).toBe(true);
  });

  test("rejeita e-mail inválido", () => {
    const result = signupSchema.safeParse({
      ...validInput,
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
  });

  test("rejeita senha curta", () => {
    const result = signupSchema.safeParse({
      ...validInput,
      password: "123",
      confirmPassword: "123",
    });

    expect(result.success).toBe(false);
  });

  test("rejeita quando confirmação de senha diverge", () => {
    const result = signupSchema.safeParse({
      ...validInput,
      confirmPassword: "outraSenha",
    });

    expect(result.success).toBe(false);
  });

  test("rejeita nome completo vazio", () => {
    const result = signupSchema.safeParse({
      ...validInput,
      fullName: "",
    });

    expect(result.success).toBe(false);
  });
});
