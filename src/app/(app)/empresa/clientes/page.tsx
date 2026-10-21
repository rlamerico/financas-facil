import type { Metadata } from "next";
import { ClientsView } from "@/components/business/clients-view";

export const metadata: Metadata = {
  title: "Clientes da Empresa",
};

export default function EmpresaClientesPage() {
  return <ClientsView />;
}
