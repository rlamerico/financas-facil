/**
 * Tipos do banco Supabase.
 *
 * Placeholder até o schema ser criado (PRD §5.2). Substituir por tipos gerados:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
