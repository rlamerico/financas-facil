import type { Metadata } from "next";
import { ReceiptsView } from "@/components/business/receipts-view";

export const metadata: Metadata = {
  title: "Recebimentos da Empresa",
};

export default function EmpresaRecebimentosPage() {
  return <ReceiptsView />;
}
