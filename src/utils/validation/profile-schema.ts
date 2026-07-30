import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Informe seu nome completo."),
});

export type ProfileInput = z.infer<typeof profileSchema>;

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * Validação do arquivo de avatar antes do upload — o bucket `avatars`
 * (migration 007) aceita qualquer arquivo do ponto de vista de RLS (a
 * policy só checa o path), então a validação de tipo/tamanho fica no
 * cliente mesmo.
 */
export const avatarFileSchema = z
  .instanceof(File)
  .refine((file) => ALLOWED_AVATAR_TYPES.includes(file.type), {
    message: "Formato de imagem não suportado. Use PNG, JPEG ou WebP.",
  })
  .refine((file) => file.size <= MAX_AVATAR_SIZE_BYTES, {
    message: "A imagem deve ter no máximo 5MB.",
  });

/** Papéis válidos (RBAC — PRD §2.1), mesmo conjunto de `nav-items.ts` `Role`. */
export const ROLE_OPTIONS = ["admin", "user", "viewer"] as const;
export type RoleOption = (typeof ROLE_OPTIONS)[number];
