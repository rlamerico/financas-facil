import type { Metadata } from "next";
import { AccountingView } from "@/components/business/accounting-view";

export const metadata: Metadata = {
  title: "Contabilidade da Empresa",
};

export default function EmpresaContabilidadePage() {
  return <AccountingView />;
}
