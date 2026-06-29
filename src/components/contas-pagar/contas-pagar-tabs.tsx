"use client";

import { useState } from "react";
import { SimpleCrud, type SimpleCrudConfig } from "@/components/crud/simple-crud";
import { useAuth } from "@/lib/auth";
import { allowedSubs } from "@/lib/access";
import { ContasPagarClient } from "./contas-pagar-client";

const statusConfig: SimpleCrudConfig = {
  table: "conta_pagar_status",
  title: "Status de Pagamento",
  subtitle: "Valores selecionáveis no campo Status Pagamento.",
  singular: "Status",
  keyField: "nome",
  fields: [{ key: "nome", label: "Nome", required: true }],
};

const tabs = [
  { id: "contas", label: "Contas a Pagar" },
  { id: "status", label: "Status Pagamento" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ContasPagarTabs() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("contas");
  const tabsVis = allowedSubs(user, "/contas-pagar", tabs);
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

      {eff === "contas" && <ContasPagarClient />}
      {eff === "status" && <SimpleCrud config={statusConfig} />}
    </div>
  );
}
