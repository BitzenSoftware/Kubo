import type { Metadata } from "next";
import { EstoqueClient } from "@/components/estoque/estoque-client";

export const metadata: Metadata = {
  title: "Estoque — Kubo ERP",
};

export default function EstoquePage() {
  return <EstoqueClient />;
}
