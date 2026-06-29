"use client";

import { useState } from "react";
import { SimpleCrud, type SimpleCrudConfig } from "@/components/crud/simple-crud";
import { useAuth } from "@/lib/auth";
import { allowedSubs } from "@/lib/access";
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
    {
      key: "padrao",
      label: "Taxa padrão",
      type: "boolean",
      trueLabel: "Sim",
      falseLabel: "Não",
    },
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
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("faturamento");
  const tabsVis = allowedSubs(user, "/faturamento", tabs);
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

      {eff === "faturamento" && <FaturamentoClient />}
      {eff === "status" && <SimpleCrud config={statusConfig} />}
      {eff === "taxa" && <SimpleCrud config={taxaConfig} />}
      {eff === "tipo" && <SimpleCrud config={tipoConfig} />}
    </div>
  );
}
