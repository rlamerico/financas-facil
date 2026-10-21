"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BusinessClient } from "@/hooks/use-business-clients";
import {
  useCreateBusinessReceipt,
  useUpdateBusinessReceipt,
  type BusinessReceipt,
  type BusinessReceiptFormInput,
} from "@/hooks/use-business-receipts";
import { usePtax } from "@/hooks/use-ptax";
import { recalculateFx, type FxField, type FxValues } from "@/utils/business/fx-fields";
import {
  businessReceiptSchema,
  todayIsoDate,
} from "@/utils/validation/business-schemas";
import { toFieldErrors } from "@/utils/validation/field-errors";
import { ReceiptFxFields, type FxInputs } from "./receipt-fx-fields";

interface ReceiptFormProps {
  companyId: string;
  clients: BusinessClient[];
  /** `null` = criação; presente = edição. */
  receipt: BusinessReceipt | null;
  onClose: () => void;
}

type ReceiptStatus = BusinessReceiptFormInput["status"];

const GENERIC_SAVE_ERROR = "Não foi possível salvar o recebimento. Tente novamente.";
const INPUT_CLASS =
  "mt-1 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function toInput(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

function parseInput(raw: string): number | null {
  if (raw.trim() === "") {
    return null;
  }

  const value = Number(raw);

  return Number.isFinite(value) ? value : null;
}

function parseInputs(inputs: FxInputs): FxValues {
  return {
    usd: parseInput(inputs.usd),
    rate: parseInput(inputs.rate),
    brl: parseInput(inputs.brl),
  };
}

function initialInputs(receipt: BusinessReceipt | null): FxInputs {
  return {
    usd: receipt?.currency === "USD" ? toInput(receipt.amount_original) : "",
    rate: toInput(receipt?.exchange_rate),
    brl: toInput(receipt?.amount_brl),
  };
}

function nullIfEmpty(value: string): string | null {
  return value.trim() === "" ? null : value;
}

/** Cadastro/edição de recebimento. Cliente do exterior usa USD + cotação; do Brasil, só BRL. */
export function ReceiptForm({ companyId, clients, receipt, onClose }: ReceiptFormProps) {
  const isEditing = Boolean(receipt);
  const [clientId, setClientId] = useState(receipt?.client_id ?? clients[0]?.id ?? "");
  const [receivedOn, setReceivedOn] = useState(receipt?.received_on ?? todayIsoDate());
  const [inputs, setInputs] = useState<FxInputs>(() => initialInputs(receipt));
  const [status, setStatus] = useState<ReceiptStatus>(
    receipt?.status === "expected" ? "expected" : "received",
  );
  const [invoiceRef, setInvoiceRef] = useState(receipt?.invoice_ref ?? "");
  const [notes, setNotes] = useState(receipt?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createReceipt = useCreateBusinessReceipt(companyId);
  const updateReceipt = useUpdateBusinessReceipt(companyId);
  const isSaving = createReceipt.isPending || updateReceipt.isPending;

  const client = clients.find((item) => item.id === clientId);
  const isForeign = client?.default_currency === "USD";
  const ptaxQuery = usePtax(isForeign ? receivedOn : null);

  const handleFxChange = (field: FxField, raw: string) => {
    const draft: FxInputs = { ...inputs, [field]: raw };
    const computed = recalculateFx(parseInputs(draft), field);

    setInputs({
      usd: field === "usd" ? raw : toInput(computed.usd),
      rate: field === "rate" ? raw : toInput(computed.rate),
      brl: field === "brl" ? raw : toInput(computed.brl),
    });
  };

  const handleUsePtax = () => {
    if (ptaxQuery.data) {
      handleFxChange("rate", String(ptaxQuery.data.sell));
    }
  };

  const buildInput = (): BusinessReceiptFormInput => {
    const values = parseInputs(inputs);
    const common = {
      client_id: clientId,
      received_on: receivedOn,
      status,
      invoice_ref: nullIfEmpty(invoiceRef),
      notes: nullIfEmpty(notes),
    };

    if (isForeign) {
      return {
        ...common,
        currency: "USD",
        amount_original: values.usd ?? 0,
        exchange_rate: values.rate,
        amount_brl: values.brl ?? 0,
        ptax_rate: ptaxQuery.data?.sell ?? null,
      };
    }

    const brlAmount = values.brl ?? 0;

    return { ...common, currency: "BRL", amount_original: brlAmount, amount_brl: brlAmount };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input = buildInput();
    const result = businessReceiptSchema.safeParse(input);
    if (!result.success) {
      setErrors(toFieldErrors(result.error.issues));
      return;
    }

    setErrors({});

    try {
      if (receipt) {
        await updateReceipt.mutateAsync({ id: receipt.id, ...input });
      } else {
        await createReceipt.mutateAsync(input);
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-surface p-6 shadow-overlay animate-fade-up">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              {isEditing ? "Editar recebimento" : "Novo recebimento"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="text-muted hover:text-foreground" aria-label="Fechar">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="receipt-client" className="text-sm font-medium">
                Cliente
              </label>
              <select
                id="receipt-client"
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                className={INPUT_CLASS}
              >
                {clients.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.default_currency})
                  </option>
                ))}
              </select>
              {errors.client_id && <p className="mt-1 text-xs text-error">{errors.client_id}</p>}
            </div>

            <div>
              <label htmlFor="receipt-date" className="text-sm font-medium">
                Data do recebimento
              </label>
              <input
                id="receipt-date"
                type="date"
                value={receivedOn}
                onChange={(event) => setReceivedOn(event.target.value)}
                className={INPUT_CLASS}
              />
              {errors.received_on && <p className="mt-1 text-xs text-error">{errors.received_on}</p>}
            </div>

            {isForeign ? (
              <ReceiptFxFields
                inputs={inputs}
                ptax={ptaxQuery.data}
                ptaxLoading={ptaxQuery.isFetching}
                ptaxError={ptaxQuery.isError}
                errors={errors}
                onChange={handleFxChange}
                onUsePtax={handleUsePtax}
              />
            ) : (
              <div>
                <label htmlFor="receipt-brl-only" className="text-sm font-medium">
                  Valor recebido (R$)
                </label>
                <input
                  id="receipt-brl-only"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={inputs.brl}
                  onChange={(event) => handleFxChange("brl", event.target.value)}
                  className={INPUT_CLASS}
                />
                {(errors.amount_original || errors.amount_brl) && (
                  <p className="mt-1 text-xs text-error">
                    {errors.amount_original ?? errors.amount_brl}
                  </p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="receipt-status" className="text-sm font-medium">
                Situação
              </label>
              <select
                id="receipt-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as ReceiptStatus)}
                className={INPUT_CLASS}
              >
                <option value="received">Recebido</option>
                <option value="expected">Previsto</option>
              </select>
            </div>

            <div>
              <label htmlFor="receipt-invoice" className="text-sm font-medium">
                Nota fiscal (opcional)
              </label>
              <input
                id="receipt-invoice"
                value={invoiceRef}
                onChange={(event) => setInvoiceRef(event.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="receipt-notes" className="text-sm font-medium">
                Observações (opcional)
              </label>
              <input
                id="receipt-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            {errors.form && <p className="text-sm text-error">{errors.form}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving || clients.length === 0}>
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
