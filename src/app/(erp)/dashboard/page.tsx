import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Kubo ERP",
};

const cards = [
  { label: "Faturamento (mês)", value: "R$ 0,00", hint: "Aguardando dados" },
  { label: "Pedidos", value: "0", hint: "Aguardando dados" },
  { label: "Clientes", value: "0", hint: "Aguardando dados" },
  { label: "Em aberto", value: "R$ 0,00", hint: "Aguardando dados" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Visão geral do seu negócio.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-slate-200 bg-white p-5"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm text-slate-500">
          Os módulos do ERP aparecerão no menu à esquerda conforme forem criados.
        </p>
      </div>
    </div>
  );
}
