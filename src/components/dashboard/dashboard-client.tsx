"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { listEventos } from "@/lib/eventos-data";
import { listEstoque } from "@/lib/estoque-data";
import { listComercial } from "@/lib/comercial-data";
import { listFreelancerServicos } from "@/lib/freelancers-data";
import { listRows } from "@/lib/config-data";
import { listCustoPorEvento, listFaturamento } from "@/lib/faturamento-data";

const fmtMoeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Card = { label: string; value: string; tone?: "default" | "good" | "bad" };

function StatCards({ cards }: { cards: Card[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">{c.label}</p>
          <p
            className={`mt-1 text-2xl font-semibold ${
              c.tone === "good"
                ? "text-emerald-600"
                : c.tone === "bad"
                  ? "text-rose-600"
                  : "text-slate-900"
            }`}
          >
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Painel genérico: carrega os dados da aba e trata loading/erro isoladamente. */
function Panel<T>({
  loader,
  render,
}: {
  loader: () => Promise<T>;
  render: (data: T) => ReactNode;
}) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    loader()
      .then((d) => on && setData(d))
      .catch((e) =>
        on && setErr(e instanceof Error ? e.message : "Erro ao carregar."),
      );
    return () => {
      on = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (err)
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {err}
      </div>
    );
  if (data == null)
    return (
      <div className="flex items-center gap-2 px-1 py-10 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    );
  return <>{render(data)}</>;
}

function EventosPanel() {
  return (
    <Panel
      loader={async () => {
        const evs = await listEventos();
        return { total: evs.length, ativos: evs.filter((e) => e.ativo).length };
      }}
      render={(d) => (
        <StatCards
          cards={[
            { label: "Total de eventos", value: String(d.total) },
            { label: "Ativos", value: String(d.ativos) },
          ]}
        />
      )}
    />
  );
}

function EstoquePanel() {
  return (
    <Panel
      loader={async () => {
        const linhas = await listEstoque();
        const sum = (f: (x: (typeof linhas)[number]) => number) =>
          linhas.reduce((a, x) => a + f(x), 0);
        return {
          itens: linhas.length,
          atual: sum((x) => x.qtd_atual),
          alocada: sum((x) => x.qtd_alocada),
          disponivel: sum((x) => x.qtd_disponivel),
        };
      }}
      render={(d) => (
        <StatCards
          cards={[
            { label: "Produtos", value: String(d.itens) },
            { label: "Qtd atual (total)", value: String(d.atual) },
            { label: "Qtd alocada", value: String(d.alocada) },
            { label: "Qtd disponível", value: String(d.disponivel), tone: d.disponivel <= 0 ? "bad" : "good" },
          ]}
        />
      )}
    />
  );
}

function ComercialPanel() {
  return (
    <Panel
      loader={async () => {
        const regs = await listComercial();
        return {
          pedidos: regs.length,
          orcado: regs.reduce((a, r) => a + (r.valor_orcado ?? 0), 0),
        };
      }}
      render={(d) => (
        <StatCards
          cards={[
            { label: "Pedidos", value: String(d.pedidos) },
            { label: "Valor orçado (total)", value: fmtMoeda(d.orcado) },
          ]}
        />
      )}
    />
  );
}

function FreelancersPanel() {
  return (
    <Panel
      loader={async () => {
        const regs = await listFreelancerServicos();
        return {
          servicos: regs.length,
          valor: regs.reduce((a, r) => a + (r.valor ?? 0), 0),
        };
      }}
      render={(d) => (
        <StatCards
          cards={[
            { label: "Serviços", value: String(d.servicos) },
            { label: "Valor (total)", value: fmtMoeda(d.valor) },
          ]}
        />
      )}
    />
  );
}

function ContasPanel() {
  return (
    <Panel
      loader={async () => {
        const rows = (await listRows("contas_pagar")) as unknown as {
          valor_total: number | null;
        }[];
        return {
          lancamentos: rows.length,
          total: rows.reduce((a, r) => a + (r.valor_total ?? 0), 0),
        };
      }}
      render={(d) => (
        <StatCards
          cards={[
            { label: "Lançamentos", value: String(d.lancamentos) },
            { label: "Total a pagar", value: fmtMoeda(d.total) },
          ]}
        />
      )}
    />
  );
}

function FaturamentoPanel() {
  return (
    <Panel
      loader={async () => {
        const [regs, custoMap] = await Promise.all([
          listFaturamento(),
          listCustoPorEvento(),
        ]);
        let bruto = 0;
        let liquido = 0;
        let custo = 0;
        for (const f of regs) {
          const vb = f.valor_bruto ?? 0;
          const pct = f.taxa?.percentual ?? 0;
          const liq = vb - vb * (pct / 100);
          bruto += vb;
          liquido += liq;
          custo += custoMap[f.evento_id ?? ""] ?? 0;
        }
        return { lancamentos: regs.length, bruto, liquido, custo, margem: liquido - custo };
      }}
      render={(d) => (
        <StatCards
          cards={[
            { label: "Lançamentos", value: String(d.lancamentos) },
            { label: "Valor bruto", value: fmtMoeda(d.bruto) },
            { label: "Valor líquido", value: fmtMoeda(d.liquido) },
            { label: "Margem R$", value: fmtMoeda(d.margem), tone: d.margem < 0 ? "bad" : "good" },
          ]}
        />
      )}
    />
  );
}

const tabs = [
  { id: "eventos", label: "Eventos", panel: <EventosPanel /> },
  { id: "estoque", label: "Estoque", panel: <EstoquePanel /> },
  { id: "comercial", label: "Comercial", panel: <ComercialPanel /> },
  { id: "freelancers", label: "Freelancers", panel: <FreelancersPanel /> },
  { id: "contas", label: "Contas a Pagar", panel: <ContasPanel /> },
  { id: "faturamento", label: "Faturamento", panel: <FaturamentoPanel /> },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function DashboardClient() {
  const [tab, setTab] = useState<TabId>("eventos");
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const isActive = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Remonta o painel ao trocar de aba (key) para recarregar os dados */}
      <div key={active.id}>{active.panel}</div>
    </div>
  );
}
