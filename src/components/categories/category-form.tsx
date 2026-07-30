"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import {
  categorySchema,
  type CategoryInput,
} from "@/utils/validation/category-schema";
import {
  useCreateCategory,
  useUpdateCategory,
  type Category,
} from "@/hooks/use-categories";

interface CategoryFormProps {
  profileId: string;
  /** `null` = modo criação; presente = modo edição. */
  category: Category | null;
  onClose: () => void;
}

const GENERIC_SAVE_ERROR = "Não foi possível salvar a categoria. Tente novamente.";
const DEFAULT_COLOR = "#2E7D32";

/** Radix `Dialog` usado tanto pra criar quanto editar uma categoria própria. */
export function CategoryForm({ profileId, category, onClose }: CategoryFormProps) {
  const isEditing = Boolean(category);

  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState<"income" | "expense">(
    (category?.type as "income" | "expense" | undefined) ?? "expense",
  );
  const [color, setColor] = useState(category?.color ?? DEFAULT_COLOR);
  const [icon, setIcon] = useState(category?.icon ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createCategory = useCreateCategory(profileId);
  const updateCategory = useUpdateCategory();
  const isSaving = createCategory.isPending || updateCategory.isPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input: CategoryInput = {
      name,
      type,
      color: color || null,
      icon: icon.trim() || null,
    };

    const result = categorySchema.safeParse(input);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    try {
      if (isEditing && category) {
        await updateCategory.mutateAsync({ id: category.id, ...result.data });
      } else {
        await createCategory.mutateAsync(result.data);
      }
      onClose();
    } catch {
      setErrors({ form: GENERIC_SAVE_ERROR });
    }
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 shadow-overlay animate-fade-up">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              {isEditing ? "Editar categoria" : "Nova categoria"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="text-muted hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="flex gap-2">
              {(["expense", "income"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setType(option)}
                  className={cn(
                    "flex-1 rounded-[var(--radius)] border px-3 py-2 text-sm font-medium transition-colors",
                    type === option
                      ? option === "income"
                        ? "border-success bg-success/10 text-success"
                        : "border-error bg-error/10 text-error"
                      : "border-border text-muted hover:bg-background",
                  )}
                >
                  {option === "income" ? "Receita" : "Despesa"}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="category-name" className="text-sm font-medium">
                Nome
              </label>
              <input
                id="category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-error">{errors.name}</p>
              )}
            </div>

            <div className="flex gap-3">
              <div>
                <label htmlFor="category-color" className="text-sm font-medium">
                  Cor
                </label>
                <input
                  id="category-color"
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="mt-1 h-10 w-16 rounded-[var(--radius)] border border-border bg-background px-1"
                />
              </div>

              <div className="flex-1">
                <label htmlFor="category-icon" className="text-sm font-medium">
                  Ícone (opcional)
                </label>
                <input
                  id="category-icon"
                  value={icon}
                  onChange={(event) => setIcon(event.target.value)}
                  placeholder="Ex: ShoppingBag"
                  className="mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <p className="mt-1 text-xs text-muted">
                  Nome de um ícone da biblioteca lucide-react.
                </p>
              </div>
            </div>

            {errors.form && <p className="text-sm text-error">{errors.form}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
