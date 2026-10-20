"use client";

import { useId, useState, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useCreateBusinessClient,
  useUpdateBusinessClient,
  type BusinessClient,
  type BusinessClientFormInput,
} from "@/hooks/use-business-clients";
import { COMMON_COUNTRIES, ORIGIN_LABELS } from "@/utils/business/labels";
import { businessClientSchema } from "@/utils/validation/business-schemas";
import { toFieldErrors } from "@/utils/validation/field-errors";

type Origin = BusinessClientFormInput["origin"];

interface ClientFormProps {
  companyId: string;
  /** `null` = criação; presente = edição. */
  client: BusinessClient | null;
  defaultOrigin: Origin;
  onClose: () => void;
}

const GENERIC_SAVE_ERROR = "Não foi possível salvar o cliente. Tente novamente.";
const INPUT_CLASS =
  "mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

/** Cadastro/edição de cliente PJ. A origem define os campos (CNPJ ou país) e a moeda padrão. */
export function ClientForm({ companyId, client, defaultOrigin, onClose }: ClientFormProps) {
  const isEditing = Boolean(client);
  const countryListId = useId();
  const [name, setName] = useState(client?.name ?? "");
  const [origin, setOrigin] = useState<Origin>(
    (client?.origin as Origin | undefined) ?? defaultOrigin,
  );
  const [document, setDocument] = useState(client?.document ?? "");
  const [country, setCountry] = useState(client?.country ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createClient = useCreateBusinessClient(companyId);
  const updateClient = useUpdateBusinessClient(companyId);
  const isSaving = createClient.isPending || updateClient.isPending;
  const isDomestic = origin === "domestic";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input: BusinessClientFormInput = {
      name,
      origin,
      document: document.trim() === "" ? null : document,
      country: isDomestic || country.trim() === "" ? null : country,
    };

    const result = businessClientSchema.safeParse(input);
    if (!result.success) {
      setErrors(toFieldErrors(result.error.issues));
      return;
    }

    setErrors({});

    try {
      if (client) {
        await updateClient.mutateAsync({ id: client.id, ...input });
      } else {
        await createClient.mutateAsync(input);
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-surface p-6 shadow-overlay animate-fade-up">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              {isEditing ? "Editar cliente" : "Novo cliente"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="text-muted hover:text-foreground" aria-label="Fechar">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="client-name" className="text-sm font-medium">
                Nome do cliente
              </label>
              <input
                id="client-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={INPUT_CLASS}
              />
              {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="client-origin" className="text-sm font-medium">
                Origem
              </label>
              <select
                id="client-origin"
                value={origin}
                onChange={(event) => setOrigin(event.target.value as Origin)}
                className={INPUT_CLASS}
              >
                <option value="domestic">{ORIGIN_LABELS.domestic} (recebe em BRL)</option>
                <option value="foreign">{ORIGIN_LABELS.foreign} (recebe em USD)</option>
              </select>
            </div>

            <div>
              <label htmlFor="client-document" className="text-sm font-medium">
                {isDomestic ? "CNPJ" : "ID fiscal (opcional)"}
              </label>
              <input
                id="client-document"
                inputMode={isDomestic ? "numeric" : "text"}
                placeholder={isDomestic ? "00.000.000/0000-00" : "Ex.: EIN, VAT"}
                value={document}
                onChange={(event) => setDocument(event.target.value)}
                className={INPUT_CLASS}
              />
              {errors.document && <p className="mt-1 text-xs text-error">{errors.document}</p>}
            </div>

            {!isDomestic && (
              <div>
                <label htmlFor="client-country" className="text-sm font-medium">
                  País (código de 2 letras)
                </label>
                <input
                  id="client-country"
                  list={countryListId}
                  placeholder="Ex.: US"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  className={INPUT_CLASS}
                />
                <datalist id={countryListId}>
                  {COMMON_COUNTRIES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </datalist>
                {errors.country && <p className="mt-1 text-xs text-error">{errors.country}</p>}
              </div>
            )}

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
