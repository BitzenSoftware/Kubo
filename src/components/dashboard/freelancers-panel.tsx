"use client";

import { useEffect, useState } from "react";
import { BarChart } from "@/components/charts/bar-chart";
import {
  listFreelancerServicos,
  type FreelancerServico,
} from "@/lib/freelancers-data";
import { agrupar, ErrBox, filterCls, LoadBox, Toggle, uniq } from "./shared";

export function FreelancersPanel() {
  const [rows, setRows] = useState<FreelancerServico[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [percent, setPercent] = useState(false);

  const [fFreelancer, setFFreelancer] = useState("");
  const [fCliente, setFCliente] = useState("");
  const [fCategoria, setFCategoria] = useState("");
  const [fPlano, setFPlano] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fEvDe, setFEvDe] = useState("");
  const [fEvAte, setFEvAte] = useState("");
  const [fVcDe, setFVcDe] = useState("");
  const [fVcAte, setFVcAte] = useState("");

  useEffect(() => {
    let on = true;
    listFreelancerServicos()
      .then((d) => on && setRows(d))
      .catch((e) => on && setErr(e instanceof Error ? e.message : "Erro ao carregar."));
    return () => {
      on = false;
    };
  }, []);

  if (err) return <ErrBox msg={err} />;
  if (!rows) return <LoadBox />;

  const filtered = rows.filter(
    (r) =>
      (!fFreelancer || r.freelancer?.nome === fFreelancer) &&
      (!fCliente || r.cliente?.nome === fCliente) &&
      (!fCategoria || r.categoria?.nome === fCategoria) &&
      (!fPlano || (r.categoria?.grupo?.nome ?? "") === fPlano) &&
      (!fStatus || r.status?.nome === fStatus) &&
      (!fEvDe || (r.data_evento_inicio ?? "") >= fEvDe) &&
      (!fEvAte || (r.data_evento_inicio ?? "") <= fEvAte) &&
      (!fVcDe || (r.data_vencimento ?? "") >= fVcDe) &&
      (!fVcAte || (r.data_vencimento ?? "") <= fVcAte),
  );

  const porFreelancer = agrupar(filtered, (r) => r.freelancer?.nome ?? "—", (r) => r.valor ?? 0);
  const porCliente = agrupar(filtered, (r) => r.cliente?.nome ?? "—", (r) => r.valor ?? 0);
  const porStatus = agrupar(filtered, (r) => r.status?.nome ?? "—", (r) => r.valor ?? 0);
  const porCategoria = agrupar(filtered, (r) => r.categoria?.nome ?? "—", (r) => r.valor ?? 0);
  const porPlano = agrupar(filtered, (r) => r.categoria?.grupo?.nome ?? "—", (r) => r.valor ?? 0);

  const temFiltro = fFreelancer || fCliente || fCategoria || fPlano || fStatus || fEvDe || fEvAte || fVcDe || fVcAte;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select aria-label="Freelancer" value={fFreelancer} onChange={(e) => setFFreelancer(e.target.value)} className={filterCls}>
          <option value="">Todos freelancers</option>
          {uniq(rows.map((r) => r.freelancer?.nome)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <select aria-label="Cliente" value={fCliente} onChange={(e) => setFCliente(e.target.value)} className={filterCls}>
          <option value="">Todos clientes</option>
          {uniq(rows.map((r) => r.cliente?.nome)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <select aria-label="Categoria" value={fCategoria} onChange={(e) => setFCategoria(e.target.value)} className={filterCls}>
          <option value="">Todas categorias</option>
          {uniq(rows.map((r) => r.categoria?.nome)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <select aria-label="Plano de Contas" value={fPlano} onChange={(e) => setFPlano(e.target.value)} className={filterCls}>
          <option value="">Todos planos de contas</option>
          {uniq(rows.map((r) => r.categoria?.grupo?.nome)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <select aria-label="Status Pagamento" value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={filterCls}>
          <option value="">Todos status</option>
          {uniq(rows.map((r) => r.status?.nome)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <label className="flex items-center gap-1 text-sm text-slate-600">
          Evento
          <input type="date" aria-label="Evento de" value={fEvDe} onChange={(e) => setFEvDe(e.target.value)} className={filterCls} />
          <span>até</span>
          <input type="date" aria-label="Evento até" value={fEvAte} onChange={(e) => setFEvAte(e.target.value)} className={filterCls} />
        </label>
        <label className="flex items-center gap-1 text-sm text-slate-600">
          Vencimento
          <input type="date" aria-label="Venc de" value={fVcDe} onChange={(e) => setFVcDe(e.target.value)} className={filterCls} />
          <span>até</span>
          <input type="date" aria-label="Venc até" value={fVcAte} onChange={(e) => setFVcAte(e.target.value)} className={filterCls} />
        </label>
        {temFiltro && (
          <button type="button" onClick={() => { setFFreelancer(""); setFCliente(""); setFCategoria(""); setFPlano(""); setFStatus(""); setFEvDe(""); setFEvAte(""); setFVcDe(""); setFVcAte(""); }} className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Limpar filtros
          </button>
        )}
        <div className="ml-auto">
          <Toggle percent={percent} setPercent={setPercent} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart title="Valor Total por Freelancer" data={porFreelancer} orientation="horizontal" percent={percent} />
        <BarChart title="Valor Total por Cliente" data={porCliente} orientation="horizontal" percent={percent} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart title="Valor Total por Categoria" data={porCategoria} orientation="horizontal" percent={percent} />
        <BarChart title="Valor Total por Plano de Contas" data={porPlano} orientation="horizontal" percent={percent} />
      </div>
      <BarChart title="Valor por Status de Pagamento" data={porStatus} percent={percent} />
    </div>
  );
}
