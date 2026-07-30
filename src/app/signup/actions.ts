"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { signupSchema } from "@/utils/validation/auth-schemas";

export interface SignupActionState {
  error: string | null;
  success: boolean;
}

export async function signup(
  _prevState: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      success: false,
    };
  }

  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message, success: false };
  }

  // Confirmação de e-mail desligada no projeto: signUp já retorna sessão.
  if (data.session) {
    redirect("/dashboard");
  }

  return { error: null, success: true };
}
