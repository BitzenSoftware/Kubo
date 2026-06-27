"use client";

import { useState } from "react";
import { SimpleCrud, type SimpleCrudConfig } from "@/components/crud/simple-crud";
import { FaturamentoClient } from "./faturamento-client";

const statusConfig: SimpleCrudConfig = {
  table: "status_recebimento",
  title: "Status Recebimento",
  subtitle: "Valores selecionáveis no campo Status Receb.",
  singular: "Status",
  keyField: "nome",
  fields: [{ key: "nome", label: "Nome", required: true }],
};

const taxaConfig: SimpleCrudConfig = {
  table: "taxa_imposto",
  title: "Taxas de Impostos",
  subtitle: "Cadastro de taxas (percentual) usadas no faturamento.",
  singular: "Taxa",
  keyField: "nome",
  fields: [
    { key: "nome", label: "Nome", required: true },
    { key: "percentual", label: "Percentual (%)", type: "number" },
  ],
};

const tipoConfig: SimpleCrudConfig = {
  table: "tipo_lancamento",
  title: "Tipo de Lançamento",
  subtitle: "Valores selecionáveis no campo Tipo.",
  singular: "Tipo de Lançamento",
  keyField: "nome",
  fields: [{ key: "nome", label: "Nome", required: true }],
};

const tabs = [
  { id: "faturamento", label: "Faturamento" },
  { id: "status", label: "Status Recebimento" },
  { id: "taxa", label: "Taxa de Impostos" },
  { id: "tipo", label: "Tipo de Lançamento" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function FaturamentoTabs() {
  const [tab, setTab] = useState<TabId>("faturamento");

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

      {tab === "faturamento" && <FaturamentoClient />}
      {tab === "status" && <SimpleCrud config={statusConfig} />}
      {tab === "taxa" && <SimpleCrud config={taxaConfig} />}
      {tab === "tipo" && <SimpleCrud config={tipoConfig} />}
    </div>
  );
}
