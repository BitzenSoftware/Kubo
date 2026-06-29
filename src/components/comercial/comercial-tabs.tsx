"use client";

import { useState } from "react";
import { SimpleCrud, type SimpleCrudConfig } from "@/components/crud/simple-crud";
import { useAuth } from "@/lib/auth";
import { allowedSubs } from "@/lib/access";
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

const agenciaConfig: SimpleCrudConfig = {
  table: "agencia",
  title: "Agências",
  subtitle: "Agências selecionáveis no campo Agência.",
  singular: "Agência",
  keyField: "nome",
  fields: [{ key: "nome", label: "Nome", required: true }],
};

const tabs = [
  { id: "pedidos", label: "Pedidos" },
  { id: "status", label: "Status Comercial" },
  { id: "vendedor", label: "Vendedor" },
  { id: "versao", label: "Versão" },
  { id: "agencia", label: "Agências" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ComercialTabs() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("pedidos");
  const tabsVis = allowedSubs(user, "/comercial", tabs);
  const eff = tabsVis.some((t) => t.id === tab) ? tab : tabsVis[0]?.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabsVis.map((t) => {
          const active = t.id === eff;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {eff === "pedidos" && <ComercialClient />}
      {eff === "status" && <SimpleCrud config={statusConfig} />}
      {eff === "vendedor" && <SimpleCrud config={vendedorConfig} />}
      {eff === "versao" && <SimpleCrud config={versaoConfig} />}
      {eff === "agencia" && <SimpleCrud config={agenciaConfig} />}
    </div>
  );
}
