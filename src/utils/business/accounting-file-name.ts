import { normalizeCnpj } from "@/utils/validation/cnpj";

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export type AccountingFileExtension = "csv" | "xlsx";

/** Nome do arquivo da contabilidade: `recebimentos-<cnpj>-AAAA-MM.<ext>`, só com caracteres seguros. */
export function accountingFileName(
  cnpj: string,
  month: string,
  extension: AccountingFileExtension,
): string {
  const digits = normalizeCnpj(cnpj);

  if (digits.length === 0) {
    throw new Error("CNPJ vazio para nomear o arquivo da contabilidade.");
  }

  if (!MONTH_KEY_PATTERN.test(month)) {
    throw new Error(`Mês inválido, use o formato AAAA-MM: ${month}`);
  }

  return `recebimentos-${digits}-${month}.${extension}`;
}
