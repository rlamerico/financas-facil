"use client";

import { cn } from "@/utils/cn";
import type { Category } from "@/hooks/use-categories";

interface CategoryRowProps {
  category: Category;
  /** `true` quando a categoria pertence ao usuário logado (editável). */
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

/** Linha da lista de categorias. Categorias padrão (globais) são somente leitura. */
export function CategoryRow({
  category,
  isOwn,
  onEdit,
  onDelete,
}: CategoryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="h-3 w-3 shrink-0 rounded-full border border-border"
          style={{ backgroundColor: category.color ?? "#9E9E9E" }}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {category.name}
          </p>
          <p className="text-xs text-muted">
            {category.type === "income" ? "Receita" : "Despesa"}
            {!isOwn ? " · Padrão" : ""}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "flex shrink-0 gap-3 text-xs font-medium",
          !isOwn && "invisible",
        )}
      >
        <button
          type="button"
          onClick={onEdit}
          className="text-secondary hover:underline"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-error hover:underline"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
