const CNPJ_LENGTH = 14;
const FIRST_CHECK_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const SECOND_CHECK_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const CHECK_MODULUS = 11;
const REPEATED_DIGITS_PATTERN = /^(\d)\1+$/;

/** Remove máscara e qualquer caractere que não seja dígito. */
export function normalizeCnpj(raw: string): string {
  return raw.replace(/\D/g, "");
}

const CNPJ_MASK_PATTERN = /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/;

/** Aplica a máscara XX.XXX.XXX/XXXX-XX; devolve o texto original se não tiver 14 dígitos. */
export function formatCnpj(digits: string): string {
  const match = CNPJ_MASK_PATTERN.exec(digits);

  if (!match) {
    return digits;
  }

  const [, a, b, c, d, e] = match;

  return `${a}.${b}.${c}/${d}-${e}`;
}

function computeCheckDigit(digits: string, weights: readonly number[]): number {
  const sum = weights.reduce(
    (total, weight, index) => total + Number(digits[index]) * weight,
    0,
  );
  const remainder = sum % CHECK_MODULUS;

  return remainder < 2 ? 0 : CHECK_MODULUS - remainder;
}

/** Valida tamanho, sequências repetidas e os dois dígitos verificadores. */
export function isValidCnpj(raw: string): boolean {
  const digits = normalizeCnpj(raw);

  if (digits.length !== CNPJ_LENGTH || REPEATED_DIGITS_PATTERN.test(digits)) {
    return false;
  }

  const firstCheck = computeCheckDigit(digits, FIRST_CHECK_WEIGHTS);
  const secondCheck = computeCheckDigit(digits, SECOND_CHECK_WEIGHTS);

  return (
    Number(digits[12]) === firstCheck && Number(digits[13]) === secondCheck
  );
}
