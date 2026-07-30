import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/services/supabase/service-role";
import { isWebhookSecretValid } from "@/utils/webhook-auth";
import {
  sheetSyncPayloadSchema,
  type MonthSnapshot,
} from "@/utils/validation/sheet-sync-schema";
import {
  buildDescription,
  diffTransactions,
  normalizeCategoryName,
  resolveTransactionDate,
  type DesiredTransaction,
  type ExistingTransaction,
} from "@/utils/sheet-sync/reconcile";
import type { Json } from "@/types/database";

const WEBHOOK_SOURCE = "sheet";

type ServiceRoleClient = ReturnType<typeof createServiceRoleClient>;

interface SyncCounters {
  inserted: number;
  updated: number;
  deleted: number;
  budgets_upserted: number;
  categories_created: number;
}

/** Arredonda pra 2 casas — DECIMAL(12,2) no banco; evita "updates" fantasmas
 *  por diferença de ponto flutuante (ex.: parcela 83.3333... da planilha). */
function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function monthDateRange(month: number, year: number) {
  const paddedMonth = String(month).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    start: `${year}-${paddedMonth}-01`,
    end: `${year}-${paddedMonth}-${String(lastDay).padStart(2, "0")}`,
  };
}

const categoryKey = (name: string, type: "income" | "expense") =>
  `${normalizeCategoryName(name)}|${type}`;

/**
 * Garante que toda categoria citada no snapshot exista (matching por nome
 * normalizado + tipo; cria as ausentes como categorias do perfil). Retorna
 * o mapa chave normalizada → id.
 */
async function ensureCategories(
  supabase: ServiceRoleClient,
  profileId: string,
  needed: Map<string, { name: string; type: "income" | "expense" }>,
  counters: SyncCounters,
): Promise<Map<string, string>> {
  const { data: existing, error } = await supabase
    .from("categories")
    .select("id, name, type")
    .or(`profile_id.is.null,profile_id.eq.${profileId}`);

  if (error) {
    throw new Error(`Falha ao carregar categorias: ${error.message}`);
  }

  const idByKey = new Map<string, string>();
  for (const category of existing ?? []) {
    idByKey.set(
      categoryKey(category.name, category.type as "income" | "expense"),
      category.id,
    );
  }

  const missing = [...needed.entries()].filter(([key]) => !idByKey.has(key));
  if (missing.length > 0) {
    const { data: created, error: insertError } = await supabase
      .from("categories")
      .insert(
        missing.map(([, category]) => ({
          profile_id: profileId,
          name: category.name,
          type: category.type,
        })),
      )
      .select("id, name, type");

    if (insertError) {
      throw new Error(`Falha ao criar categorias: ${insertError.message}`);
    }

    for (const category of created ?? []) {
      idByKey.set(
        categoryKey(category.name, category.type as "income" | "expense"),
        category.id,
      );
    }
    counters.categories_created += missing.length;
  }

  return idByKey;
}

/** Monta as transações desejadas (despesas com sinal negativo + entradas). */
function buildDesiredTransactions(
  snapshot: MonthSnapshot,
  categoryIdByKey: Map<string, string>,
): DesiredTransaction[] {
  const expenses = snapshot.transactions.map((row) => {
    const { date, originalDate } = resolveTransactionDate(
      row.date ?? null,
      snapshot.month,
      snapshot.year,
    );
    return {
      external_ref: row.ref,
      description: buildDescription(row.category, row.description, originalDate),
      amount: roundCurrency(-Math.abs(row.amount)),
      date,
      category_id:
        categoryIdByKey.get(categoryKey(row.category, "expense")) ?? null,
      payment_method: row.payment_method?.trim() || null,
    };
  });

  const firstDay = `${snapshot.year}-${String(snapshot.month).padStart(2, "0")}-01`;
  const incomes = snapshot.incomes.map((row) => ({
    external_ref: row.ref,
    description: row.description,
    amount: roundCurrency(Math.abs(row.amount)),
    date: firstDay,
    category_id:
      categoryIdByKey.get(categoryKey(row.description, "income")) ?? null,
    payment_method: null,
  }));

  return [...expenses, ...incomes];
}

/** Reconcilia um mês: espelho de transações + upsert do Planejado. */
async function reconcileMonth(
  supabase: ServiceRoleClient,
  profileId: string,
  snapshot: MonthSnapshot,
  counters: SyncCounters,
): Promise<void> {
  const needed = new Map<string, { name: string; type: "income" | "expense" }>();
  for (const row of snapshot.transactions) {
    needed.set(categoryKey(row.category, "expense"), {
      name: row.category.trim(),
      type: "expense",
    });
  }
  for (const row of snapshot.incomes) {
    needed.set(categoryKey(row.description, "income"), {
      name: row.description.trim(),
      type: "income",
    });
  }
  for (const row of snapshot.budgets) {
    needed.set(categoryKey(row.category, "expense"), {
      name: row.category.trim(),
      type: "expense",
    });
  }

  const categoryIdByKey = await ensureCategories(
    supabase,
    profileId,
    needed,
    counters,
  );

  const desired = buildDesiredTransactions(snapshot, categoryIdByKey);

  const { start, end } = monthDateRange(snapshot.month, snapshot.year);
  const { data: existingRows, error: existingError } = await supabase
    .from("transactions")
    .select("id, external_ref, description, amount, date, category_id, payment_method")
    .eq("profile_id", profileId)
    .eq("source", WEBHOOK_SOURCE)
    .gte("date", start)
    .lte("date", end);

  if (existingError) {
    throw new Error(`Falha ao carregar transações: ${existingError.message}`);
  }

  const existing = (existingRows ?? []).filter(
    (row): row is typeof row & { external_ref: string } =>
      row.external_ref !== null,
  ) as ExistingTransaction[];

  const diff = diffTransactions(existing, desired);

  if (diff.toInsert.length > 0) {
    const { error: insertError } = await supabase.from("transactions").insert(
      diff.toInsert.map((transaction) => ({
        ...transaction,
        profile_id: profileId,
        source: WEBHOOK_SOURCE,
        status: "completed",
      })),
    );
    if (insertError) {
      throw new Error(`Falha ao inserir transações: ${insertError.message}`);
    }
    counters.inserted += diff.toInsert.length;
  }

  for (const { id, ...fields } of diff.toUpdate) {
    const { error: updateError } = await supabase
      .from("transactions")
      .update(fields)
      .eq("id", id);
    if (updateError) {
      throw new Error(`Falha ao atualizar transação: ${updateError.message}`);
    }
    counters.updated += 1;
  }

  if (diff.toDeleteIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .in("id", diff.toDeleteIds);
    if (deleteError) {
      throw new Error(`Falha ao remover transações: ${deleteError.message}`);
    }
    counters.deleted += diff.toDeleteIds.length;
  }

  // Dedupe por categoria: nomes que normalizam igual (ex.: "Água"/"Agua")
  // caem no mesmo category_id, e o upsert do Postgres não aceita a mesma
  // chave duas vezes no batch — a última ocorrência da planilha vence.
  const budgetByCategory = new Map<string, number>();
  for (const row of snapshot.budgets) {
    const categoryId = categoryIdByKey.get(categoryKey(row.category, "expense"));
    if (categoryId) {
      budgetByCategory.set(categoryId, roundCurrency(row.planned));
    }
  }
  const budgetRows = [...budgetByCategory.entries()].map(
    ([categoryId, planned]) => ({
      profile_id: profileId,
      category_id: categoryId,
      month: snapshot.month,
      year: snapshot.year,
      planned_amount: planned,
    }),
  );

  if (budgetRows.length > 0) {
    const { error: budgetError } = await supabase
      .from("budgets")
      .upsert(budgetRows, { onConflict: "profile_id,category_id,month,year" });
    if (budgetError) {
      throw new Error(`Falha ao gravar orçamentos: ${budgetError.message}`);
    }
    counters.budgets_upserted += budgetRows.length;
  }
}

/**
 * Webhook receptor do snapshot da planilha "Finanças Familiares 2026"
 * (Apps Script — `scripts/apps-script/sheet-sync.gs`). Sync ESPELHO:
 * upsert por `external_ref`, remoção de refs ausentes — tocando somente
 * transações com `source='sheet'`. Idempotente: reenviar o mesmo snapshot
 * é no-op. Erros no meio deixam o estado parcial, mas o próximo snapshot
 * reconverge (não há efeito cumulativo).
 */
export async function POST(request: Request) {
  const supabase = createServiceRoleClient();
  const receivedSecret = request.headers.get("x-webhook-secret");

  const logEvent = (params: {
    profileId: string | null;
    status: string;
    payload: Json | null;
  }) =>
    supabase.from("integrations_log").insert({
      source: WEBHOOK_SOURCE,
      status: params.status,
      payload: params.payload,
      profile_id: params.profileId,
    });

  if (!isWebhookSecretValid(receivedSecret, process.env.SHEET_SYNC_SECRET)) {
    await logEvent({ profileId: null, status: "unauthorized", payload: null });
    return NextResponse.json({ error: "Secret inválido." }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    await logEvent({ profileId: null, status: "error", payload: null });
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = sheetSyncPayloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    await logEvent({
      profileId: null,
      status: "error",
      payload: { issues: parsed.error.issues.length } as Json,
    });
    return NextResponse.json(
      {
        error: "Payload inválido.",
        issues: parsed.error.issues.slice(0, 10).map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const { profile_id, months } = parsed.data;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profile_id)
    .maybeSingle();

  if (!profile) {
    await logEvent({ profileId: null, status: "error", payload: null });
    return NextResponse.json(
      { error: "profile_id não encontrado." },
      { status: 404 },
    );
  }

  const counters: SyncCounters = {
    inserted: 0,
    updated: 0,
    deleted: 0,
    budgets_upserted: 0,
    categories_created: 0,
  };

  try {
    for (const snapshot of months) {
      await reconcileMonth(supabase, profile_id, snapshot, counters);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    await logEvent({
      profileId: profile_id,
      status: "error",
      payload: { message, ...counters } as unknown as Json,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await logEvent({
    profileId: profile_id,
    status: "success",
    payload: { months: months.length, ...counters } as unknown as Json,
  });

  return NextResponse.json({ months: months.length, ...counters });
}
