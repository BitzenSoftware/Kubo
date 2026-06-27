"use client";

import { useState } from "react";
import { SimpleCrud, type SimpleCrudConfig } from "@/components/crud/simple-crud";
import { ComercialClient } from "./comercial-client";

const statusConfig: SimpleCrudConfig = {
  table: "status_comercial",
  title: "Status Comercial",
  subtitle: "Valores selecionáveis no campo Status Comercial.",
  singular: "Status",
  keyField: "nome",
  fields: [{ key: "nome", label: "Nome", required: true }],
};

const vendedorConfig: SimpleCrudConfig = {
  table: "vendedor",
  title: "Vendedores",
  subtitle: "Cadastro de vendedores.",
  singular: "Vendedor",
  keyField: "nome",
  fields: [{ key: "nome", label: "Nome", required: true }],
};

const versaoConfig: SimpleCrudConfig = {
  table: "versao",
  title: "Versões",
  subtitle: "Valores selecionáveis no campo Obs/Versão.",
  singular: "Versão",
  keyField: "nome",
  fields: [{ key: "nome", label: "Nome", required: true }],
};

const tabs = [
  { id: "pedidos", label: "Pedidos" },
  { id: "status", label: "Status Comercial" },
  { id: "vendedor", label: "Vendedor" },
  { id: "versao", label: "Versão" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ComercialTabs() {
  const [tab, setTab] = useState<TabId>("pedidos");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "pedidos" && <ComercialClient />}
      {tab === "status" && <SimpleCrud config={statusConfig} />}
      {tab === "vendedor" && <SimpleCrud config={vendedorConfig} />}
      {tab === "versao" && <SimpleCrud config={versaoConfig} />}
    </div>
  );
}
