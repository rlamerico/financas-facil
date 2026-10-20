import type { Metadata } from "next";
import { CompaniesView } from "@/components/business/companies-view";

export const metadata: Metadata = {
  title: "Empresa",
};

export default function EmpresaPage() {
  return <CompaniesView />;
}
