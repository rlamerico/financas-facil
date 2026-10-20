import { NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { PtaxError, fetchPtaxForDate } from "@/utils/business/ptax";
import { ptaxDateSchema } from "@/utils/validation/business-schemas";

const DATE_PARAM = "date";
const PTAX_CACHE_CONTROL = "private, max-age=3600";
const FALLBACK_ERROR_STATUS = 502;
const FALLBACK_ERROR_MESSAGE = "Falha ao consultar a cotação PTAX.";

/** Cotação PTAX de referência para recebimentos em USD. Exige sessão do usuário. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Não autenticado." },
      { status: 401 },
    );
  }

  const dateParam = new URL(request.url).searchParams.get(DATE_PARAM);
  const parsedDate = ptaxDateSchema.safeParse(dateParam);

  if (!parsedDate.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsedDate.error.issues[0]?.message ?? "Data inválida.",
      },
      { status: 400 },
    );
  }

  try {
    const data = await fetchPtaxForDate(parsedDate.data);

    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": PTAX_CACHE_CONTROL } },
    );
  } catch (error) {
    const isKnownError = error instanceof PtaxError;

    return NextResponse.json(
      {
        success: false,
        error: isKnownError ? error.message : FALLBACK_ERROR_MESSAGE,
      },
      { status: isKnownError ? error.status : FALLBACK_ERROR_STATUS },
    );
  }
}
