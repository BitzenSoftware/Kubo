import type { Metadata } from "next";
import { EventosClient } from "@/components/eventos/eventos-client";

export const metadata: Metadata = {
  title: "Eventos — Kubo ERP",
};

export default function EventosPage() {
  return <EventosClient />;
}
