import { z } from "zod";

export const CATEGORY_TYPES = ["income", "expense"] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

/**
 * Categorias próprias do usuário (não-`is_default`). `color` e `icon` são
 * opcionais: `color` vira o hex do input `type="color"`, `icon` guarda o
 * nome do ícone lucide-react como texto (mesma convenção da seed em
 * `003_seed_categories.sql` — nunca o componente React em si).
 */
export const categorySchema = z.object({
  name: z.string().trim().min(1, "Informe um nome."),
  type: z.enum(CATEGORY_TYPES),
  color: z.string().trim().min(1).nullable().optional(),
  icon: z.string().trim().min(1).nullable().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
