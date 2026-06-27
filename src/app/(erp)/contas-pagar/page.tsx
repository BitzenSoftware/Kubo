import type { Metadata } from "next";
import { ContasPagarTabs } from "@/components/contas-pagar/contas-pagar-tabs";

export const metadata: Metadata = {
  title: "Contas a Pagar — Kubo ERP",
};

export default function ContasPagarPage() {
  return <ContasPagarTabs />;
}
