"use client";

import { useEffect, useState } from "react";
import { BarChart } from "@/components/charts/bar-chart";
import { listContas, type ContaPagar } from "@/lib/contas-pagar-data";
import { agrupar, ErrBox, filterCls, LoadBox, Toggle, uniq } from "./shared";

export function ContasPanel() {
  const [rows, setRows] = useState<ContaPagar[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [percent, setPercent] = useState(false);

  const [fStatus, setFStatus] = useState("");
  const [fFornecedor, setFFornecedor] = useState("");
  const [fEmpresa, setFEmpresa] = useState("");
  const [fCategoria, setFCategoria] = useState("");
  const [fGrupo, setFGrupo] = useState("");
  const [fEvento, setFEvento] = useState("");
  const [fVcDe, setFVcDe] = useState("");
  const [fVcAte, setFVcAte] = useState("");

  useEffect(() => {
    let on = true;
    listContas()
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
      (!fFornecedor || r.fornecedor === fFornecedor) &&
      (!fEmpresa || r.empresa?.nome === fEmpresa) &&
      (!fCategoria || r.categoria?.nome === fCategoria) &&
      (!fGrupo || (r.categoria?.grupo?.nome ?? "") === fGrupo) &&
      (!fEvento || r.evento?.id_evento === fEvento) &&
      (!fVcDe || (r.data_vencimento ?? "") >= fVcDe) &&
      (!fVcAte || (r.data_vencimento ?? "") <= fVcAte),
  );

  const v = (r: ContaPagar) => r.valor_total ?? 0;
  const porStatus = agrupar(filtered, (r) => r.status?.nome ?? "—", v);
  const porFornecedor = agrupar(filtered, (r) => r.fornecedor ?? "—", v);
  const porCategoria = agrupar(filtered, (r) => r.categoria?.nome ?? "—", v);
  const porGrupo = agrupar(filtered, (r) => r.categoria?.grupo?.nome ?? "—", v);
  const porEvento = agrupar(
    filtered,
    (r) => r.evento?.nome ?? r.evento?.id_evento ?? "—",
    v,
  );

  const temFiltro = fStatus || fFornecedor || fEmpresa || fCategoria || fGrupo || fEvento || fVcDe || fVcAte;

  // ---- Cartões: período de Vencimento vs mesmo período no mês anterior ----
  const baseCat = rows.filter(
    (r) =>
      (!fStatus || r.status?.nome === fStatus) &&
      (!fFornecedor || r.fornecedor === fFornecedor) &&
      (!fEmpresa || r.empresa?.nome === fEmpresa) &&
      (!fCategoria || r.categoria?.nome === fCategoria) &&
      (!fGrupo || (r.categoria?.grupo?.nome ?? "") === fGrupo) &&
      (!fEvento || r.evento?.id_evento === fEvento),
  );
  const mesesComDados = uniq(
    baseCat.map((r) => (r.data_vencimento ? r.data_vencimento.slice(0, 7) : null)),
  ).sort();
  const mesAtual = mesesComDados[mesesComDados.length - 1] || new Date().toISOString().slice(0, 7);
  const mesAnterior = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  };
  const somaSe = (cond: (r: ContaPagar) => boolean) => {
    let total = 0;
    let count = 0;
    for (const r of baseCat) {
      if (!cond(r)) continue;
      total += r.valor_total ?? 0;
      count += 1;
    }
    return { total, count };
  };
  let cur: { total: number; count: number };
  let prev: { total: number; count: number };
  if (fVcDe && fVcAte) {
    cur = somaSe((r) => {
      const x = r.data_vencimento ?? "";
      return !!x && x >= fVcDe && x <= fVcAte;
    });
    const pDe = mesAnterior(fVcDe);
    const pAte = mesAnterior(fVcAte);
    prev = somaSe((r) => {
      const x = r.data_vencimento ?? "";
      return !!x && x >= pDe && x <= pAte;
    });
  } else {
    const pMes = mesAnterior(`${mesAtual}-01`).slice(0, 7);
    cur = somaSe((r) => (r.data_vencimento ?? "").startsWith(mesAtual));
    prev = somaSe((r) => (r.data_vencimento ?? "").startsWith(pMes));
  }
  const cresc = (c: number, p: number) => (p !== 0 ? ((c - p) / p) * 100 : c > 0 ? 100 : 0);
  const fmtCompact = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
  const ticket = (s: { total: number; count: number }) => (s.count ? s.total / s.count : 0);
  const cards = [
    { label: "Total a Pagar", value: fmtCompact(cur.total), g: cresc(cur.total, prev.total) },
    { label: "Lançamentos", value: String(cur.count), g: cresc(cur.count, prev.count) },
    { label: "Ticket Médio", value: fmtCompact(ticket(cur)), g: cresc(ticket(cur), ticket(prev)) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select aria-label="Status" value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={filterCls}>
          <option value="">Todos status</option>
          {uniq(rows.map((r) => r.status?.nome)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <select aria-label="Fornecedor" value={fFornecedor} onChange={(e) => setFFornecedor(e.target.value)} className={filterCls}>
          <option value="">Todos fornecedores</option>
          {uniq(rows.map((r) => r.fornecedor)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <select aria-label="Empresa" value={fEmpresa} onChange={(e) => setFEmpresa(e.target.value)} className={filterCls}>
          <option value="">Todas empresas</option>
          {uniq(rows.map((r) => r.empresa?.nome)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <select aria-label="Categoria" value={fCategoria} onChange={(e) => setFCategoria(e.target.value)} className={filterCls}>
          <option value="">Todas categorias</option>
          {uniq(rows.map((r) => r.categoria?.nome)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <select aria-label="Grupo" value={fGrupo} onChange={(e) => setFGrupo(e.target.value)} className={filterCls}>
          <option value="">Todos grupos</option>
          {uniq(rows.map((r) => r.categoria?.grupo?.nome)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <select aria-label="ID Evento" value={fEvento} onChange={(e) => setFEvento(e.target.value)} className={filterCls}>
          <option value="">Todos eventos</option>
          {uniq(rows.map((r) => r.evento?.id_evento)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <label className="flex items-center gap-1 text-sm text-slate-600">
          Vencimento
          <input type="date" aria-label="Venc de" value={fVcDe} onChange={(e) => setFVcDe(e.target.value)} className={filterCls} />
          <span>até</span>
          <input type="date" aria-label="Venc até" value={fVcAte} onChange={(e) => setFVcAte(e.target.value)} className={filterCls} />
        </label>
        {temFiltro && (
          <button type="button" onClick={() => { setFStatus(""); setFFornecedor(""); setFEmpresa(""); setFCategoria(""); setFGrupo(""); setFEvento(""); setFVcDe(""); setFVcAte(""); }} className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Limpar filtros
          </button>
        )}
        <div className="ml-auto">
          <Toggle percent={percent} setPercent={setPercent} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{c.value}</p>
            <p className={`mt-1 text-xs font-medium ${c.g >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {c.g >= 0 ? "▲" : "▼"} {Math.abs(c.g).toFixed(1)}% vs mês anterior
            </p>
          </div>
        ))}
      </div>

      <BarChart title="Valor Total por Status de Pagamento" data={porStatus} orientation="horizontal" percent={percent} />
      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart title="Valor Total por Fornecedor" data={porFornecedor} percent={percent} />
        <BarChart title="Valor Total por Categoria" data={porCategoria} orientation="horizontal" percent={percent} />
      </div>
      <BarChart title="Valor Total por Grupo" data={porGrupo} orientation="horizontal" percent={percent} />
      <BarChart title="Valor Total por Evento" data={porEvento} orientation="horizontal" percent={percent} />
    </div>
  );
}
