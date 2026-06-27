import type { Metadata } from "next";
import { FaturamentoTabs } from "@/components/faturamento/faturamento-tabs";

export const metadata: Metadata = {
  title: "Faturamento — Kubo ERP",
};

export default function FaturamentoPage() {
  return <FaturamentoTabs />;
}
