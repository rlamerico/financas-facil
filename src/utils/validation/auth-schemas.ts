import { z } from "zod";

const MIN_PASSWORD_LENGTH = 8;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail.").email("E-mail inválido."),
  password: z.string().min(1, "Informe sua senha."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Informe seu nome completo."),
    email: z.string().trim().min(1, "Informe seu e-mail.").email("E-mail inválido."),
    password: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      ),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;
