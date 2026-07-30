"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useCategories,
  useDeleteCategory,
  type Category,
} from "@/hooks/use-categories";
import { CategoryForm } from "./category-form";
import { CategoryRow } from "./category-row";

interface CategoriesViewProps {
  profileId: string;
}

type FormState = { mode: "create" } | { mode: "edit"; category: Category };

const FK_VIOLATION_CODE = "23503";
const DELETE_IN_USE_ERROR =
  "Não é possível excluir: essa categoria está em uso em transações ou metas.";
const DELETE_GENERIC_ERROR = "Não foi possível excluir a categoria.";

/**
 * Client Component: lista as categorias visíveis (padrão + próprias) e o
 * modal de criação/edição. Categorias padrão (`is_default`) são somente
 * leitura — a RLS da migration 004 já bloqueia no servidor, aqui só
 * escondemos as ações de editar/excluir pra não confundir o usuário.
 */
export function CategoriesView({ profileId }: CategoriesViewProps) {
  const { data: categories, isLoading, isError } = useCategories();
  const deleteCategory = useDeleteCategory();
  const [formState, setFormState] = useState<FormState | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sortedCategories = useMemo(
    () => [...(categories ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const handleDelete = async (category: Category) => {
    const confirmed = window.confirm(`Excluir a categoria "${category.name}"?`);
    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    try {
      await deleteCategory.mutateAsync(category.id);
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      setDeleteError(
        code === FK_VIOLATION_CODE ? DELETE_IN_USE_ERROR : DELETE_GENERIC_ERROR,
      );
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Categorias</h2>
        <Button type="button" onClick={() => setFormState({ mode: "create" })}>
          <Plus className="h-4 w-4" aria-hidden />
          Nova categoria
        </Button>
      </div>

      {deleteError && (
        <p className="mt-2 text-sm text-error">{deleteError}</p>
      )}

      <div className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface shadow-card">
        {isLoading && (
          <p className="p-4 text-sm text-muted">Carregando categorias...</p>
        )}
        {isError && (
          <p className="p-4 text-sm text-error">
            Não foi possível carregar as categorias.
          </p>
        )}
        {!isLoading && !isError && sortedCategories.length === 0 && (
          <p className="p-4 text-sm text-muted">Nenhuma categoria cadastrada.</p>
        )}
        {sortedCategories.map((category) => (
          <CategoryRow
            key={category.id}
            category={category}
            isOwn={category.profile_id === profileId}
            onEdit={() => setFormState({ mode: "edit", category })}
            onDelete={() => handleDelete(category)}
          />
        ))}
      </div>

      {formState && (
        <CategoryForm
          profileId={profileId}
          category={formState.mode === "edit" ? formState.category : null}
          onClose={() => setFormState(null)}
        />
      )}
    </div>
  );
}
