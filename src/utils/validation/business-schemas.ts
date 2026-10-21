import { z } from "zod";
import { isValidCnpj, normalizeCnpj } from "./cnpj";

export const COMPANY_REGIMES = ["mei", "simples", "outro"] as const;
export const BUSINESS_ORIGINS = ["domestic", "foreign"] as const;
export const BUSINESS_CURRENCIES = ["BRL", "USD"] as const;
export const RECEIPT_STATUSES = ["expected", "received"] as const;

const CURRENCY_BY_ORIGIN = {
  domestic: "BRL",
  foreign: "USD",
} as const;

const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_LENGTH = 10;
const MS_PER_MINUTE = 60_000;

function isRealIsoDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function todayIsoDate(now: Date = new Date()): string {
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * MS_PER_MINUTE);

  return localNow.toISOString().slice(0, ISO_DATE_LENGTH);
}

export const companySchema = z.object({
  legal_name: z.string().trim().min(1, "Informe a razão social."),
  trade_name: z.string().trim().min(1).nullable().optional(),
  cnpj: z
    .string()
    .trim()
    .refine(isValidCnpj, "CNPJ inválido.")
    .transform(normalizeCnpj),
  regime: z.enum(COMPANY_REGIMES),
});

export type CompanyInput = z.infer<typeof companySchema>;

const businessClientBaseSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do cliente."),
  document: z.string().trim().min(1).nullable().optional(),
  origin: z.enum(BUSINESS_ORIGINS),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(COUNTRY_CODE_PATTERN, "Informe o país com 2 letras (ex.: US).")
    .nullable()
    .optional(),
  default_currency: z.enum(BUSINESS_CURRENCIES).optional(),
});

export const businessClientSchema = businessClientBaseSchema
  .superRefine((client, ctx) => {
    if (client.origin === "foreign" && !client.country) {
      ctx.addIssue({
        code: "custom",
        path: ["country"],
        message: "Informe o país do cliente no exterior.",
      });
    }

    if (
      client.default_currency !== undefined &&
      client.default_currency !== CURRENCY_BY_ORIGIN[client.origin]
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["default_currency"],
        message: "Cliente do Brasil usa BRL; cliente do exterior usa USD.",
      });
    }

    if (client.origin === "domestic" && !isValidCnpj(client.document ?? "")) {
      ctx.addIssue({
        code: "custom",
        path: ["document"],
        message: "Informe um CNPJ válido para cliente do Brasil.",
      });
    }
  })
  .transform((client) => ({
    ...client,
    default_currency: client.default_currency ?? CURRENCY_BY_ORIGIN[client.origin],
    document:
      client.origin === "domestic" && client.document
        ? normalizeCnpj(client.document)
        : client.document,
  }));

export type BusinessClientInput = z.infer<typeof businessClientSchema>;

const receiptBaseSchema = z.object({
  client_id: z.string().trim().min(1, "Selecione o cliente."),
  received_on: z
    .string()
    .trim()
    .regex(ISO_DATE_PATTERN, "Informe a data no formato AAAA-MM-DD.")
    .refine(isRealIsoDate, "Data inválida."),
  amount_original: z.coerce.number().positive("O valor deve ser maior que zero."),
  amount_brl: z.coerce
    .number()
    .positive("O valor em BRL deve ser maior que zero."),
  ptax_rate: z.coerce.number().positive().nullable().optional(),
  invoice_ref: z.string().trim().min(1).nullable().optional(),
  notes: z.string().trim().min(1).nullable().optional(),
  attachment_url: z.string().trim().min(1).nullable().optional(),
  status: z.enum(RECEIPT_STATUSES).default("received"),
});

const brlReceiptSchema = receiptBaseSchema
  .extend({
    currency: z.literal("BRL"),
    exchange_rate: z.null().optional(),
  })
  .refine((receipt) => receipt.amount_brl === receipt.amount_original, {
    message: "Em BRL, o valor em BRL deve ser igual ao valor recebido.",
    path: ["amount_brl"],
  });

const usdReceiptSchema = receiptBaseSchema.extend({
  currency: z.literal("USD"),
  exchange_rate: z.coerce.number().positive("Informe a cotação do dólar."),
});

export const businessReceiptSchema = z
  .discriminatedUnion("currency", [brlReceiptSchema, usdReceiptSchema])
  .superRefine((receipt, ctx) => {
    const isFutureDate = receipt.received_on > todayIsoDate();

    if (receipt.status === "received" && isFutureDate) {
      ctx.addIssue({
        code: "custom",
        path: ["received_on"],
        message: "Recebimento não pode ter data futura.",
      });
    }
  });

export type BusinessReceiptInput = z.infer<typeof businessReceiptSchema>;

export const ptaxDateSchema = z
  .string()
  .trim()
  .regex(ISO_DATE_PATTERN, "Informe a data no formato AAAA-MM-DD.")
  .refine(isRealIsoDate, "Data inválida.")
  .refine((value) => value <= todayIsoDate(), "A data não pode ser futura.");
