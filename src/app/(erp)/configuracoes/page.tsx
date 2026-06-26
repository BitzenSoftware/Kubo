import type { Metadata } from "next";
import { ConfigClient } from "@/components/configuracoes/config-client";

export const metadata: Metadata = {
  title: "Configurações — Kubo ERP",
};

export default function ConfiguracoesPage() {
  return <ConfigClient />;
}
