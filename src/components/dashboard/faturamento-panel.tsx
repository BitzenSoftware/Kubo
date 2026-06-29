"use client";

import { useEffect, useState } from "react";
import { BarChart } from "@/components/charts/bar-chart";
import {
  listCustoPorEvento,
  listFaturamento,
  type Faturamento,
} from "@/lib/faturamento-data";
import { agrupar, ErrBox, filterCls, LoadBox, Toggle, uniq } from "./shared";

const fmtMoeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function FaturamentoPanel() {
  const [rows, setRows] = useState<Faturamento[] | null>(null);
  const [custoMap, setCustoMap] = useState<Record<string, number>>({});
  const [err, setErr] = useState<string | null>(null);
  const [percent, setPercent] = useState(false);

  const [fCliente, setFCliente] = useState("");
  const [fEmpresa, setFEmpresa] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fEmDe, setFEmDe] = useState("");
  const [fEmAte, setFEmAte] = useState("");

  useEffect(() => {
    let on = true;
    Promise.all([listFaturamento(), listCustoPorEvento()])
      .then(([r, c]) => {
        if (!on) return;
        setRows(r);
        setCustoMap(c);
      })
      .catch((e) => on && setErr(e instanceof Error ? e.message : "Erro ao carregar."));
    return () => {
      on = false;
    };
  }, []);

  if (err) return <ErrBox msg={err} />;
  if (!rows) return <LoadBox />;

  const calcRow = (f: Faturamento) => {
    const bruto = f.valor_bruto ?? 0;
    const pct = f.taxa?.percentual ?? 0;
    const imposto = bruto * (pct / 100);
    const liquido = bruto - imposto;
    const custo = custoMap[f.evento_id ?? ""] ?? 0;
    return { bruto, imposto, liquido, custo, margem: liquido - custo };
  };

  const filtered = rows.filter(
    (r) =>
      (!fCliente || r.cliente?.nome === fCliente) &&
      (!fEmpresa || r.empresa?.nome === fEmpresa) &&
      (!fStatus || r.status?.nome === fStatus) &&
      (!fEmDe || (r.data_emissao ?? "") >= fEmDe) &&
      (!fEmAte || (r.data_emissao ?? "") <= fEmAte),
  );

  const porBrutoCliente = agrupar(filtered, (r) => r.cliente?.nome ?? "—", (r) => calcRow(r).bruto);
  const porLiquidoCliente = agrupar(filtered, (r) => r.cliente?.nome ?? "—", (r) => calcRow(r).liquido);
  const porImpostoEmpresa = agrupar(filtered, (r) => r.empresa?.nome ?? "—", (r) => calcRow(r).imposto);

  const margemPorCliente = uniq(filtered.map((r) => r.cliente?.nome))
    .map((c) => {
      const rs = filtered.filter((r) => (r.cliente?.nome ?? "") === c);
      let liq = 0;
      let mar = 0;
      for (const r of rs) {
        const k = calcRow(r);
        liq += k.liquido;
        mar += k.margem;
      }
      const pct = liq !== 0 ? (mar / liq) * 100 : 0;
      return {
        label: c,
        value: mar,
        subMoney: fmtMoeda(mar),
        subPercent: `${pct.toFixed(1)}%`,
      };
    })
    .sort((a, b) => b.value - a.value);

  const temFiltro = fCliente || fEmpresa || fStatus || fEmDe || fEmAte;

  // ---- Cartões: totais do mês + crescimento vs mês anterior ----
  const baseCat = rows.filter(
    (r) =>
      (!fCliente || r.cliente?.nome === fCliente) &&
      (!fEmpresa || r.empresa?.nome === fEmpresa) &&
      (!fStatus || r.status?.nome === fStatus),
  );
  const mesesComDados = uniq(
    baseCat.map((r) => (r.data_emissao ? r.data_emissao.slice(0, 7) : null)),
  ).sort();

  // Faturamento pendente (sem data de emissão) por cliente
  const pendentePorCliente = agrupar(
    baseCat.filter((r) => !r.data_emissao),
    (r) => r.cliente?.nome ?? "—",
    (r) => calcRow(r).bruto,
  );
  const hojeMes = new Date().toISOString().slice(0, 7);
  const mesAtual = mesesComDados[mesesComDados.length - 1] || hojeMes;
  const prevMes = (() => {
    const [y, m] = mesAtual.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();
  const somaSe = (cond: (r: (typeof baseCat)[number]) => boolean) => {
    let bruto = 0;
    let custo = 0;
    let liquido = 0;
    for (const r of baseCat) {
      if (!cond(r)) continue;
      const k = calcRow(r);
      bruto += k.bruto;
      custo += k.custo;
      liquido += k.liquido;
    }
    return { bruto, custo, liquido };
  };
  const mesAnterior = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  };

  let cur: { bruto: number; custo: number; liquido: number };
  let prev: { bruto: number; custo: number; liquido: number };
  if (fEmDe && fEmAte) {
    // Período selecionado vs o mesmo período no mês anterior
    cur = somaSe((r) => {
      const v = r.data_emissao ?? "";
      return !!v && v >= fEmDe && v <= fEmAte;
    });
    const prevDe = mesAnterior(fEmDe);
    const prevAte = mesAnterior(fEmAte);
    prev = somaSe((r) => {
      const v = r.data_emissao ?? "";
      return !!v && v >= prevDe && v <= prevAte;
    });
  } else {
    // Fallback: mês mais recente com dados vs mês anterior
    cur = somaSe((r) => (r.data_emissao ?? "").startsWith(mesAtual));
    prev = somaSe((r) => (r.data_emissao ?? "").startsWith(prevMes));
  }
  const cresc = (c: number, p: number) =>
    p !== 0 ? ((c - p) / p) * 100 : c > 0 ? 100 : 0;
  const fmtCompact = (v: number) =>
    v.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    });
  const cards = [
    { label: "Receita Faturada", value: cur.bruto, g: cresc(cur.bruto, prev.bruto) },
    { label: "Custo Total", value: cur.custo, g: cresc(cur.custo, prev.custo) },
    { label: "Resultado Líquido", value: cur.liquido, g: cresc(cur.liquido, prev.liquido) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select aria-label="Cliente" value={fCliente} onChange={(e) => setFCliente(e.target.value)} className={filterCls}>
          <option value="">Todos clientes</option>
          {uniq(rows.map((r) => r.cliente?.nome)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <select aria-label="Empresa" value={fEmpresa} onChange={(e) => setFEmpresa(e.target.value)} className={filterCls}>
          <option value="">Todas empresas</option>
          {uniq(rows.map((r) => r.empresa?.nome)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <select aria-label="Status Recebimento" value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={filterCls}>
          <option value="">Todos status</option>
          {uniq(rows.map((r) => r.status?.nome)).map((o) => (<option key={o} value={o}>{o}</option>))}
        </select>
        <label className="flex items-center gap-1 text-sm text-slate-600">
          Emissão
          <input type="date" aria-label="Emissão de" value={fEmDe} onChange={(e) => setFEmDe(e.target.value)} className={filterCls} />
          <span>até</span>
          <input type="date" aria-label="Emissão até" value={fEmAte} onChange={(e) => setFEmAte(e.target.value)} className={filterCls} />
        </label>
        {temFiltro && (
          <button type="button" onClick={() => { setFCliente(""); setFEmpresa(""); setFStatus(""); setFEmDe(""); setFEmAte(""); }} className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Limpar filtros
          </button>
        )}
        <div className="ml-auto">
          <Toggle percent={percent} setPercent={setPercent} />
        </div>
      </div>

      {/* Cartões: mês mais recente com dados vs mês anterior */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">{c.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{fmtCompact(c.value)}</p>
              <p className={`mt-1 text-xs font-medium ${c.g >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {c.g >= 0 ? "▲" : "▼"} {Math.abs(c.g).toFixed(1)}% vs mês anterior
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart title="Valor Bruto por Cliente" data={porBrutoCliente} percent={percent} />
        <BarChart title="Valor Líquido por Cliente" data={porLiquidoCliente} percent={percent} />
      </div>
      <BarChart title="Margem" data={margemPorCliente} orientation="horizontal" percent={percent} />
      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart title="Impostos Totais por Empresa" data={porImpostoEmpresa} percent={percent} />
        <BarChart title="Faturamento Pendente por Cliente (sem emissão)" data={pendentePorCliente} percent={percent} />
      </div>
    </div>
  );
}
