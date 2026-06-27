import type { Metadata } from "next";
import { EventosTabs } from "@/components/eventos/eventos-tabs";

export const metadata: Metadata = {
  title: "Eventos — Kubo ERP",
};

export default function EventosPage() {
  return <EventosTabs />;
}
