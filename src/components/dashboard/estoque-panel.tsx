"use client";

import { useEffect, useState } from "react";
import { GroupedBarChart, type GroupRow } from "@/components/charts/grouped-bar-chart";
import { listEstoque, type EstoqueLinha } from "@/lib/estoque-data";
import { ErrBox, LoadBox, Toggle } from "./shared";

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-rose-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

const series = [
  { key: "atual", label: "Atual", color: "bg-blue-600" },
  { key: "alocada", label: "Alocada", color: "bg-amber-500" },
  { key: "disponivel", label: "Disponível", color: "bg-emerald-500" },
];

export function EstoquePanel() {
  const [rows, setRows] = useState<EstoqueLinha[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [percent, setPercent] = useState(false);

  useEffect(() => {
    let on = true;
    listEstoque()
      .then((d) => on && setRows(d))
      .catch((e) => on && setErr(e instanceof Error ? e.message : "Erro ao carregar."));
    return () => {
      on = false;
    };
  }, []);

  if (err) return <ErrBox msg={err} />;
  if (!rows) return <LoadBox />;

  const sum = (f: (x: EstoqueLinha) => number) => rows.reduce((a, x) => a + f(x), 0);
  const totalAtual = sum((x) => x.qtd_atual);
  const totalAloc = sum((x) => x.qtd_alocada);
  const totalDisp = sum((x) => x.qtd_disponivel);

  // Agrupa por categoria
  const mapa = new Map<string, { atual: number; alocada: number; disponivel: number }>();
  for (const r of rows) {
    const k = r.categoria || "—";
    const cur = mapa.get(k) ?? { atual: 0, alocada: 0, disponivel: 0 };
    cur.atual += r.qtd_atual;
    cur.alocada += r.qtd_alocada;
    cur.disponivel += r.qtd_disponivel;
    mapa.set(k, cur);
  }
  const grouped: GroupRow[] = Array.from(mapa, ([label, v]) => ({
    label,
    values: { atual: v.atual, alocada: v.alocada, disponivel: v.disponivel },
  })).sort((a, b) => b.values.atual - a.values.atual);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Produtos" value={String(rows.length)} />
        <StatCard label="Qtd atual (total)" value={String(totalAtual)} />
        <StatCard label="Qtd alocada" value={String(totalAloc)} />
        <StatCard label="Qtd disponível" value={String(totalDisp)} tone={totalDisp <= 0 ? "bad" : "good"} />
      </div>

      <div className="flex justify-end">
        <Toggle percent={percent} setPercent={setPercent} absLabel="Qtd" />
      </div>

      <GroupedBarChart
        title="Estoque por Categoria"
        series={series}
        rows={grouped}
        percent={percent}
        money={false}
      />
    </div>
  );
}
