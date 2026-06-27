"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { updateRow } from "@/lib/config-data";
import { listEstoque, type EstoqueLinha } from "@/lib/estoque-data";

export function EstoqueClient() {
  const [rows, setRows] = useState<EstoqueLinha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRows(await listEstoque());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar o estoque.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function setQtdLocal(id: string, qtd: number) {
    setRows((rs) =>
      rs.map((r) =>
        r.id === id
          ? { ...r, qtd_atual: qtd, qtd_disponivel: qtd - r.qtd_alocada }
          : r,
      ),
    );
  }

  async function saveQtd(id: string, qtd: number) {
    setError(null);
    try {
      await updateRow("produtos", id, { qtd_atual: qtd });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar a quantidade.");
    }
  }

  const columns: Column<EstoqueLinha>[] = [
    { key: "codigo", header: "Código", render: (r) => r.codigo },
    { key: "nome", header: "Nome", render: (r) => r.nome },
    {
      key: "qtd_atual",
      header: "Qtd atual",
      render: (r) => (
        <input
          type="number"
          min={0}
          aria-label={`Quantidade atual de ${r.nome}`}
          value={r.qtd_atual}
          onChange={(e) => setQtdLocal(r.id, Number(e.target.value))}
          onBlur={(e) => saveQtd(r.id, Number(e.target.value))}
          className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      ),
    },
    { key: "qtd_alocada", header: "Qtd alocada", render: (r) => r.qtd_alocada },
    {
      key: "qtd_disponivel",
      header: "Qtd disponível",
      render: (r) => (
        <span
          className={`font-semibold ${
            r.qtd_disponivel <= 0 ? "text-rose-600" : "text-emerald-600"
          }`}
        >
          {r.qtd_disponivel}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Estoque</h1>
        <p className="text-sm text-slate-500">
          Qtd alocada = locações de eventos com status que aloca. Disponível =
          atual − alocada.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">Produtos em estoque</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-slate-500">
            Nenhum produto cadastrado. Cadastre produtos no menu Produtos.
          </div>
        ) : (
          <DataTable<EstoqueLinha>
            rows={rows}
            getRowKey={(r) => r.id}
            columns={columns}
          />
        )}
      </div>
    </div>
  );
}
