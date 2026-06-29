"use client";

import { useState } from "react";
import { SimpleCrud, type SimpleCrudConfig } from "@/components/crud/simple-crud";
import { useAuth } from "@/lib/auth";
import { allowedSubs } from "@/lib/access";
import { FreelancerServicoClient } from "./freelancer-servico-client";

const freelancersConfig: SimpleCrudConfig = {
  table: "freelancers",
  title: "Freelancers",
  subtitle: "Cadastro de freelancers.",
  singular: "Freelancer",
  keyField: "nome",
  fields: [
    { key: "nome", label: "Nome", required: true },
    { key: "cpf", label: "CPF", placeholder: "000.000.000-00" },
    { key: "rg", label: "RG" },
    { key: "nascimento", label: "Data de Nascimento", type: "date" },
  ],
};

const categoriaConfig: SimpleCrudConfig = {
  table: "categoria_freelancer",
  title: "Categoria Freelancer",
  subtitle: "Categorias com Nome e Grupo (do Plano de Contas).",
  singular: "Categoria",
  keyField: "nome",
  fields: [
    { key: "nome", label: "Nome", required: true },
    { key: "grupo_id", label: "Grupo", type: "select", optionsFrom: "grupo_plano" },
  ],
};

const tabs = [
  { id: "servicos", label: "Serviços" },
  { id: "freelancers", label: "Freelancers" },
  { id: "categoria", label: "Categoria Freelancer" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function FreelancersTabs() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("servicos");
  const tabsVis = allowedSubs(user, "/freelancers", tabs);
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

      {eff === "servicos" && <FreelancerServicoClient />}
      {eff === "freelancers" && <SimpleCrud config={freelancersConfig} />}
      {eff === "categoria" && <SimpleCrud config={categoriaConfig} />}
    </div>
  );
}
