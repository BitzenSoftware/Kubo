"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { deleteRow, insertRow, listRows, updateRow } from "@/lib/config-data";
import { listEventos } from "@/lib/eventos-data";
import {
  listCustoPorEvento,
  listFaturamento,
  type Faturamento,
} from "@/lib/faturamento-data";

type Opt = { id: string; nome: string };
type TaxaOpt = { id: string; nome: string; percentual: number };
type EventoOpt = { id: string; id_evento: string; nome: string; cliente_id: string | null };

const emptyForm = {
  cliente_id: "",
  evento_id: "",
  valor_bruto: "",
  empresa_id: "",
  taxa_id: "",
  nota_fiscal: "",
  data_emissao: "",
  vencimento: "",
  status_recebimento_id: "",
  data_recebimento: "",
  tipo_id: "",
};

const fmtData = (v: string | null) => {
  if (!v) return "—";
  const [y, m, d] = v.split("-");
  return y && m && d ? `${d}/${m}/${y}` : v;
};
const fmtMoeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => `${v.toFixed(2)}%`;

function calc(valorBruto: number, pct: number, custo: number) {
  const imposto = valorBruto * (pct / 100);
  const liquido = valorBruto - imposto;
  const margemRS = liquido - custo;
  const margemPct = liquido !== 0 ? (margemRS / liquido) * 100 : 0;
  return { imposto, liquido, custo, margemRS, margemPct };
}

export function FaturamentoClient() {
  const [registros, setRegistros] = useState<Faturamento[]>([]);
  const [eventos, setEventos] = useState<EventoOpt[]>([]);
  const [clientes, setClientes] = useState<Opt[]>([]);
  const [empresas, setEmpresas] = useState<Opt[]>([]);
  const [taxas, setTaxas] = useState<TaxaOpt[]>([]);
  const [statusRec, setStatusRec] = useState<Opt[]>([]);
  const [tipos, setTipos] = useState<Opt[]>([]);
  const [custoMap, setCustoMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [fCliente, setFCliente] = useState("");
  const [fEvento, setFEvento] = useState("");
  const [fEmpresa, setFEmpresa] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [fTaxa, setFTaxa] = useState("");
  const [fEmisDe, setFEmisDe] = useState("");
  const [fEmisAte, setFEmisAte] = useState("");
  const [fRecDe, setFRecDe] = useState("");
  const [fRecAte, setFRecAte] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Faturamento | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [regs, evs, cls, emps, txs, srs, tps, custo] = await Promise.all([
        listFaturamento(),
        listEventos(),
        listRows("clientes"),
        listRows("empresa"),
        listRows("taxa_imposto"),
        listRows("status_recebimento"),
        listRows("tipo_lancamento"),
        listCustoPorEvento(),
      ]);
      setRegistros(regs);
      setEventos(
        evs.map((e) => ({
          id: e.id,
          id_evento: e.id_evento,
          nome: e.nome,
          cliente_id: e.cliente_id,
        })),
      );
      const toOpt = (rows: { id: unknown; nome?: unknown }[]) =>
        rows.map((r) => ({ id: String(r.id), nome: String(r.nome ?? "") }));
      setClientes(toOpt(cls));
      setEmpresas(toOpt(emps));
      setTaxas(
        txs.map((t) => ({
          id: String(t.id),
          nome: String(t.nome ?? ""),
          percentual: Number(t.percentual ?? 0),
        })),
      );
      setStatusRec(toOpt(srs));
      setTipos(toOpt(tps));
      setCustoMap(custo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  }

  function openEdit(f: Faturamento) {
    setEditing(f);
    setFormError(null);
    setForm({
      cliente_id: f.cliente_id ?? "",
      evento_id: f.evento_id ?? "",
      valor_bruto: f.valor_bruto == null ? "" : String(f.valor_bruto),
      empresa_id: f.empresa_id ?? "",
      taxa_id: f.taxa_id ?? "",
      nota_fiscal: f.nota_fiscal ?? "",
      data_emissao: f.data_emissao ?? "",
      vencimento: f.vencimento ?? "",
      status_recebimento_id: f.status_recebimento_id ?? "",
      data_recebimento: f.data_recebimento ?? "",
      tipo_id: f.tipo_id ?? "",
    });
    setModalOpen(true);
  }

  const eventosDoCliente = form.cliente_id
    ? eventos.filter((e) => e.cliente_id === form.cliente_id)
    : [];
  const idEvento = eventos.find((e) => e.id === form.evento_id)?.id_evento ?? "";
  const pctForm = taxas.find((t) => t.id === form.taxa_id)?.percentual ?? 0;
  const calcForm = calc(
    Number(form.valor_bruto || 0),
    pctForm,
    custoMap[form.evento_id] ?? 0,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.valor_bruto) {
      setFormError("Informe o Valor Bruto.");
      return;
    }
    if (
      form.evento_id &&
      registros.some((r) => r.evento_id === form.evento_id && r.id !== editing?.id)
    ) {
      setFormError("Já existe um faturamento para este evento.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        cliente_id: form.cliente_id || null,
        evento_id: form.evento_id || null,
        valor_bruto: form.valor_bruto === "" ? null : Number(form.valor_bruto),
        empresa_id: form.empresa_id || null,
        taxa_id: form.taxa_id || null,
        nota_fiscal: form.nota_fiscal.trim() || null,
        data_emissao: form.data_emissao || null,
        vencimento: form.vencimento || null,
        status_recebimento_id: form.status_recebimento_id || null,
        data_recebimento: form.data_recebimento || null,
        tipo_id: form.tipo_id || null,
      };
      if (editing) {
        await updateRow("faturamento", editing.id, payload);
      } else {
        await insertRow("faturamento", payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo(f: Faturamento) {
    setError(null);
    try {
      await updateRow("faturamento", f.id, { ativo: !f.ativo });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar o status.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir este faturamento?")) return;
    setError(null);
    try {
      await deleteRow("faturamento", id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  const columns: Column<Faturamento>[] = [
    { key: "id_evento", header: "ID Evento", render: (f) => f.evento?.id_evento ?? "—" },
    { key: "cliente", header: "Cliente", render: (f) => f.cliente?.nome ?? "—" },
    { key: "evento", header: "Evento", render: (f) => f.evento?.nome ?? "—" },
    { key: "valor_bruto", header: "Valor Bruto", render: (f) => fmtMoeda(f.valor_bruto ?? 0) },
    { key: "empresa", header: "Empresa", render: (f) => f.empresa?.nome ?? "—" },
    { key: "taxa", header: "Taxa", render: (f) => (f.taxa ? `${f.taxa.nome} (${f.taxa.percentual}%)` : "—") },
    {
      key: "imposto",
      header: "Imposto",
      render: (f) => fmtMoeda(calc(f.valor_bruto ?? 0, f.taxa?.percentual ?? 0, custoMap[f.evento_id ?? ""] ?? 0).imposto),
    },
    {
      key: "liquido",
      header: "Valor Líquido",
      render: (f) => fmtMoeda(calc(f.valor_bruto ?? 0, f.taxa?.percentual ?? 0, custoMap[f.evento_id ?? ""] ?? 0).liquido),
    },
    {
      key: "custo",
      header: "Custo do Evento",
      render: (f) => fmtMoeda(custoMap[f.evento_id ?? ""] ?? 0),
    },
    {
      key: "margem_rs",
      header: "Margem R$",
      render: (f) => {
        const m = calc(f.valor_bruto ?? 0, f.taxa?.percentual ?? 0, custoMap[f.evento_id ?? ""] ?? 0).margemRS;
        return <span className={m < 0 ? "text-rose-600" : "text-emerald-600"}>{fmtMoeda(m)}</span>;
      },
    },
    {
      key: "margem_pct",
      header: "Margem %",
      render: (f) => {
        const m = calc(f.valor_bruto ?? 0, f.taxa?.percentual ?? 0, custoMap[f.evento_id ?? ""] ?? 0).margemPct;
        return <span className={m < 0 ? "text-rose-600" : "text-emerald-600"}>{fmtPct(m)}</span>;
      },
    },
    { key: "nota_fiscal", header: "Nota Fiscal", render: (f) => f.nota_fiscal ?? "—" },
    { key: "data_emissao", header: "Data Emissão", render: (f) => fmtData(f.data_emissao) },
    { key: "vencimento", header: "Vencimento", render: (f) => fmtData(f.vencimento) },
    {
      key: "status",
      header: "Status Receb.",
      render: (f) =>
        f.status ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{f.status.nome}</span>
        ) : (
          "—"
        ),
    },
    { key: "data_recebimento", header: "Data Recebimento", render: (f) => fmtData(f.data_recebimento) },
    { key: "tipo", header: "Tipo", render: (f) => f.tipo?.nome ?? "—" },
  ];

  const inputCls =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
  const roCls = "w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500";
  const filterCls =
    "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

  const inc = (v: string | null, t: string) =>
    (v ?? "").toLowerCase().includes(t.trim().toLowerCase());
  const registrosFiltrados = registros.filter(
    (f) =>
      inc(f.cliente?.nome ?? "", fCliente) &&
      inc(f.evento?.nome ?? "", fEvento) &&
      (!fEmpresa || f.empresa_id === fEmpresa) &&
      (!fStatus || f.status_recebimento_id === fStatus) &&
      (!fTipo || f.tipo_id === fTipo) &&
      (!fTaxa || f.taxa_id === fTaxa) &&
      (!fEmisDe || (f.data_emissao ?? "") >= fEmisDe) &&
      (!fEmisAte || (f.data_emissao ?? "") <= fEmisAte) &&
      (!fRecDe || (f.data_recebimento ?? "") >= fRecDe) &&
      (!fRecAte || (f.data_recebimento ?? "") <= fRecAte),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Faturamento</h1>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">Lançamentos</h2>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Adicionar Faturamento
          </Button>
        </div>

        {registros.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-3">
            <input value={fCliente} onChange={(e) => setFCliente(e.target.value)} placeholder="Cliente" className={filterCls} />
            <input value={fEvento} onChange={(e) => setFEvento(e.target.value)} placeholder="Evento" className={filterCls} />
            <select aria-label="Filtrar empresa" value={fEmpresa} onChange={(e) => setFEmpresa(e.target.value)} className={filterCls}>
              <option value="">Todas empresas</option>
              {empresas.map((emp) => (<option key={emp.id} value={emp.id}>{emp.nome}</option>))}
            </select>
            <select aria-label="Filtrar status recebimento" value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={filterCls}>
              <option value="">Todos status</option>
              {statusRec.map((s) => (<option key={s.id} value={s.id}>{s.nome}</option>))}
            </select>
            <select aria-label="Filtrar tipo" value={fTipo} onChange={(e) => setFTipo(e.target.value)} className={filterCls}>
              <option value="">Todos tipos</option>
              {tipos.map((t) => (<option key={t.id} value={t.id}>{t.nome}</option>))}
            </select>
            <select aria-label="Filtrar taxa" value={fTaxa} onChange={(e) => setFTaxa(e.target.value)} className={filterCls}>
              <option value="">Todas taxas</option>
              {taxas.map((t) => (<option key={t.id} value={t.id}>{t.nome}</option>))}
            </select>
            <label className="flex items-center gap-1 text-sm text-slate-600">
              Emissão
              <input type="date" aria-label="Emissão de" value={fEmisDe} onChange={(e) => setFEmisDe(e.target.value)} className={filterCls} />
              <span>até</span>
              <input type="date" aria-label="Emissão até" value={fEmisAte} onChange={(e) => setFEmisAte(e.target.value)} className={filterCls} />
            </label>
            <label className="flex items-center gap-1 text-sm text-slate-600">
              Recebimento
              <input type="date" aria-label="Recebimento de" value={fRecDe} onChange={(e) => setFRecDe(e.target.value)} className={filterCls} />
              <span>até</span>
              <input type="date" aria-label="Recebimento até" value={fRecAte} onChange={(e) => setFRecAte(e.target.value)} className={filterCls} />
            </label>
            {(fCliente || fEvento || fEmpresa || fStatus || fTipo || fTaxa || fEmisDe || fEmisAte || fRecDe || fRecAte) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFCliente(""); setFEvento(""); setFEmpresa(""); setFStatus("");
                  setFTipo(""); setFTaxa(""); setFEmisDe(""); setFEmisAte(""); setFRecDe(""); setFRecAte("");
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : registros.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm text-slate-500">Nenhum faturamento cadastrado.</p>
            <button type="button" onClick={openCreate} className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Adicionar o primeiro
            </button>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-slate-500">
            Nenhum faturamento para os filtros.
          </div>
        ) : (
          <DataTable<Faturamento>
            rows={registrosFiltrados}
            getRowKey={(f) => f.id}
            columns={columns}
            actions={(f) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAtivo(f)}
                  title={f.ativo ? "Clique para inativar" : "Clique para ativar"}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                    f.ativo ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-slate-300 text-slate-700 hover:bg-slate-400"
                  }`}
                >
                  {f.ativo ? "Ativo" : "Inativo"}
                </button>
                <button type="button" onClick={() => openEdit(f)} className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-800" aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => handleDelete(f.id)} className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-rose-600" aria-label="Excluir">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          />
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="2xl" title={editing ? "Editar Faturamento" : "Novo Faturamento"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Cliente</label>
              <select aria-label="Cliente" value={form.cliente_id} onChange={(e) => setForm((f) => ({ ...f, cliente_id: e.target.value, evento_id: "" }))} className={inputCls}>
                <option value="">Selecione...</option>
                {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Evento</label>
              <select aria-label="Evento" value={form.evento_id} disabled={!form.cliente_id} onChange={(e) => setForm((f) => ({ ...f, evento_id: e.target.value }))} className={form.cliente_id ? inputCls : roCls}>
                <option value="">
                  {!form.cliente_id ? "Selecione o cliente primeiro" : eventosDoCliente.length ? "Selecione..." : "Cliente sem eventos"}
                </option>
                {eventosDoCliente.map((ev) => (<option key={ev.id} value={ev.id}>{ev.id_evento} — {ev.nome}</option>))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">ID Evento</label>
              <input disabled value={idEvento || "—"} className={roCls} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Valor Bruto</label>
              <input required type="number" min={0} step="0.01" value={form.valor_bruto} onChange={(e) => setForm((f) => ({ ...f, valor_bruto: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Empresa</label>
              <select aria-label="Empresa" value={form.empresa_id} onChange={(e) => setForm((f) => ({ ...f, empresa_id: e.target.value }))} className={inputCls}>
                <option value="">Selecione...</option>
                {empresas.map((emp) => (<option key={emp.id} value={emp.id}>{emp.nome}</option>))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Taxa</label>
              <select aria-label="Taxa" value={form.taxa_id} onChange={(e) => setForm((f) => ({ ...f, taxa_id: e.target.value }))} className={inputCls}>
                <option value="">Selecione...</option>
                {taxas.map((t) => (<option key={t.id} value={t.id}>{t.nome} ({t.percentual}%)</option>))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nota Fiscal</label>
              <input value={form.nota_fiscal} onChange={(e) => setForm((f) => ({ ...f, nota_fiscal: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status Recebimento</label>
              <select aria-label="Status Recebimento" value={form.status_recebimento_id} onChange={(e) => setForm((f) => ({ ...f, status_recebimento_id: e.target.value }))} className={inputCls}>
                <option value="">Selecione...</option>
                {statusRec.map((s) => (<option key={s.id} value={s.id}>{s.nome}</option>))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Data Emissão</label>
              <input type="date" value={form.data_emissao} onChange={(e) => setForm((f) => ({ ...f, data_emissao: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Vencimento</label>
              <input type="date" value={form.vencimento} onChange={(e) => setForm((f) => ({ ...f, vencimento: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Data Recebimento</label>
              <input type="date" value={form.data_recebimento} onChange={(e) => setForm((f) => ({ ...f, data_recebimento: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tipo (Lançamento)</label>
              <select aria-label="Tipo" value={form.tipo_id} onChange={(e) => setForm((f) => ({ ...f, tipo_id: e.target.value }))} className={inputCls}>
                <option value="">Selecione...</option>
                {tipos.map((t) => (<option key={t.id} value={t.id}>{t.nome}</option>))}
              </select>
            </div>
          </div>

          {/* Resumo calculado */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-5">
            <div>
              <p className="text-xs text-slate-500">Imposto</p>
              <p className="text-sm font-semibold text-slate-800">{fmtMoeda(calcForm.imposto)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Valor Líquido</p>
              <p className="text-sm font-semibold text-slate-800">{fmtMoeda(calcForm.liquido)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Custo do Evento</p>
              <p className="text-sm font-semibold text-slate-800">{fmtMoeda(calcForm.custo)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Margem R$</p>
              <p className={`text-sm font-semibold ${calcForm.margemRS < 0 ? "text-rose-600" : "text-emerald-600"}`}>{fmtMoeda(calcForm.margemRS)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Margem %</p>
              <p className={`text-sm font-semibold ${calcForm.margemPct < 0 ? "text-rose-600" : "text-emerald-600"}`}>{fmtPct(calcForm.margemPct)}</p>
            </div>
          </div>

          {formError && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
