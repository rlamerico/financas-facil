import type { CompanyInput, BusinessClientInput } from "@/utils/validation/business-schemas";

export const REGIME_LABELS: Record<CompanyInput["regime"], string> = {
  mei: "MEI",
  simples: "Simples Nacional",
  outro: "Outro",
};

export const ORIGIN_LABELS: Record<BusinessClientInput["origin"], string> = {
  domestic: "Brasil",
  foreign: "Exterior",
};

export const CURRENCY_SYMBOLS = {
  BRL: "R$",
  USD: "US$",
} as const;

/** Países mais comuns para sugerir no cadastro de cliente do exterior (ISO-3166 alfa-2). */
export const COMMON_COUNTRIES = [
  { code: "US", name: "Estados Unidos" },
  { code: "PT", name: "Portugal" },
  { code: "GB", name: "Reino Unido" },
  { code: "DE", name: "Alemanha" },
  { code: "FR", name: "França" },
  { code: "ES", name: "Espanha" },
  { code: "IT", name: "Itália" },
  { code: "CA", name: "Canadá" },
  { code: "AU", name: "Austrália" },
  { code: "JP", name: "Japão" },
] as const;
