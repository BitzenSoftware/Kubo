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

  const temFiltro = fStatus || fFornecedor || fEmpresa || fCategoria || fGrupo || fEvento || fVcDe || fVcAte;

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

      <BarChart title="Valor Total por Status de Pagamento" data={porStatus} orientation="horizontal" percent={percent} />
      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart title="Valor Total por Fornecedor" data={porFornecedor} percent={percent} />
        <BarChart title="Valor Total por Categoria" data={porCategoria} orientation="horizontal" percent={percent} />
      </div>
    </div>
  );
}
