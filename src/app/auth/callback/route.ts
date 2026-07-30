import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/services/supabase/server";

/**
 * Único Route Handler desta fase: troca o `code` do link de confirmação de
 * e-mail por uma sessão válida e redireciona o usuário.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
