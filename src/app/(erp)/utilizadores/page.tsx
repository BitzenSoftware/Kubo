import type { Metadata } from "next";
import { UsuariosClient } from "@/components/usuarios/usuarios-client";

export const metadata: Metadata = {
  title: "Utilizadores — Kubo ERP",
};

export default function UtilizadoresPage() {
  return <UsuariosClient />;
}
