import type { Metadata } from "next";
import { ComercialTabs } from "@/components/comercial/comercial-tabs";

export const metadata: Metadata = {
  title: "Comercial — Kubo ERP",
};

export default function ComercialPage() {
  return <ComercialTabs />;
}
