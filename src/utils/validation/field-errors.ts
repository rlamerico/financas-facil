export interface ValidationIssue {
  path: PropertyKey[];
  message: string;
}

/** Converte issues do Zod em `{ campo: mensagem }`, mantendo só o primeiro erro de cada campo. */
export function toFieldErrors(issues: readonly ValidationIssue[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of issues) {
    const key = String(issue.path[0]);

    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}
