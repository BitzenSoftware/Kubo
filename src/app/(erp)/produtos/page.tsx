import type { Metadata } from "next";
import { ProdutosClient } from "@/components/produtos/produtos-client";

export const metadata: Metadata = {
  title: "Produtos — Kubo ERP",
};

export default function ProdutosPage() {
  return <ProdutosClient />;
}
