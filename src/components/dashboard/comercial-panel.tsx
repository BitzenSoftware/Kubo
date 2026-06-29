"use client";

import { useEffect, useState } from "react";
import { BarChart } from "@/components/charts/bar-chart";
import { listComercial, type Comercial } from "@/lib/comercial-data";
import { agrupar, ErrBox, filterCls, LoadBox, Toggle, uniq } from "./shared";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function ComercialPanel() {
  const [rows, setRows] = useState<Comercial[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [percent, setPercent] = useState(false);

  const [fStatus, setFStatus] = useState("");
  const [fCliente, setFCliente] = useState("");
  const [fAgencia, setFAgencia] = useState("");
  const [fVendedor, setFVendedor] = useState("");
  const [fDe, setFDe] = useState("");
  const [fAte, setFAte] = useState("");

  useEffect(() => {
    let on = true;
    listComercial()
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
      (!fStatus || r.status?.nome === fStatus) &&
      (!fCliente || r.cliente?.nome === fCliente) &&
      (!fAgencia || r.agencia?.nome === fAgencia) &&
      (!fVendedor || r.vendedor?.nome === fVendedor) &&
      (!fDe || (r.data_evento_inicio ?? "") >= fDe) &&
      (!fAte || (r.data_evento_inicio ?? "") <= fAte),
  );

  const porMes = MESES.map((m, i) => ({
    label: m,
    value: filtered
      .filter((r) => r.data_pedido && Number(r.data_pedido.slice(5, 7)) === i + 1)
      .reduce((a, r) => a + (r.valor_orcado ?? 0), 0),
  }));
  const porCliente = agrupar(filtered, (r) => r.cliente?.nome ?? "—", (r) => r.valor_orcado ?? 0);
  const porStatus = agrupar(filtered, (r) => r.status?.nome ?? "—", (r) => r.valor_orcado ?? 0);

  const temFiltro = fStatus || fCliente || fAgencia || fVendedor || fDe || fAte;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select aria-label="Status Comercial" value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={filterCls}>
          <option value="">Todos status</option>
          {uniq(rows.map((r) => r.status?.nome)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <select aria-label="Cliente" value={fCliente} onChange={(e) => setFCliente(e.target.value)} className={filterCls}>
          <option value="">Todos clientes</option>
          {uniq(rows.map((r) => r.cliente?.nome)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <select aria-label="Agência" value={fAgencia} onChange={(e) => setFAgencia(e.target.value)} className={filterCls}>
          <option value="">Todas agências</option>
          {uniq(rows.map((r) => r.agencia?.nome)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <select aria-label="Vendedor" value={fVendedor} onChange={(e) => setFVendedor(e.target.value)} className={filterCls}>
          <option value="">Todos vendedores</option>
          {uniq(rows.map((r) => r.vendedor?.nome)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <label className="flex items-center gap-1 text-sm text-slate-600">
          Data evento
          <input type="date" aria-label="De" value={fDe} onChange={(e) => setFDe(e.target.value)} className={filterCls} />
          <span>até</span>
          <input type="date" aria-label="Até" value={fAte} onChange={(e) => setFAte(e.target.value)} className={filterCls} />
        </label>
        {temFiltro && (
          <button type="button" onClick={() => { setFStatus(""); setFCliente(""); setFAgencia(""); setFVendedor(""); setFDe(""); setFAte(""); }} className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Limpar filtros
          </button>
        )}
        <div className="ml-auto">
          <Toggle percent={percent} setPercent={setPercent} />
        </div>
      </div>

      <BarChart title="Valor Orçado Mensal" data={porMes} orientation="horizontal" percent={percent} />
      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart title="Valor Orçado por Cliente" data={porCliente} orientation="horizontal" percent={percent} />
        <BarChart title="Valor Orçado por Status Comercial" data={porStatus} percent={percent} />
      </div>
    </div>
  );
}
