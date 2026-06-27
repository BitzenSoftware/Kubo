"use client";

import { useState } from "react";
import { SimpleCrud, type SimpleCrudConfig } from "@/components/crud/simple-crud";
import { EventosClient } from "./eventos-client";

const statusConfig: SimpleCrudConfig = {
  table: "evento_status",
  title: "Status de Evento",
  subtitle:
    'O comportamento "Aloca" reserva os itens de Locação no estoque; "Libera" não reserva.',
  singular: "Status",
  keyField: "nome",
  fields: [
    { key: "nome", label: "Nome", required: true },
    {
      key: "aloca",
      label: "Ação no estoque",
      type: "boolean",
      trueLabel: "Aloca",
      falseLabel: "Libera",
    },
  ],
};

const tabs = [
  { id: "eventos", label: "Eventos" },
  { id: "status", label: "Status" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function EventosTabs() {
  const [tab, setTab] = useState<TabId>("eventos");

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
                  ? "bg-blue-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "eventos" ? (
        <EventosClient />
      ) : (
        <SimpleCrud config={statusConfig} />
      )}
    </div>
  );
}
