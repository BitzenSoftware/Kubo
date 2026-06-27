import type { Metadata } from "next";
import { SimpleCrud, type SimpleCrudConfig } from "@/components/crud/simple-crud";

export const metadata: Metadata = {
  title: "Clientes — Kubo ERP",
};

const config: SimpleCrudConfig = {
  table: "clientes",
  title: "Clientes",
  singular: "Cliente",
  keyField: "nome",
  fields: [
    { key: "nome", label: "Nome", required: true },
    { key: "cnpj", label: "CNPJ", placeholder: "00.000.000/0000-00" },
  ],
};

export default function ClientesPage() {
  return <SimpleCrud config={config} />;
}
