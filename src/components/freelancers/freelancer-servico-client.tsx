"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { deleteRow, insertRow, listRows, updateRow } from "@/lib/config-data";
import { listEventos } from "@/lib/eventos-data";
import {
  listCategoriasFreelancer,
  listFreelancerServicos,
  type CategoriaFreelancerOpt,
  type FreelancerServico,
} from "@/lib/freelancers-data";

type Opt = { id: string; nome: string };
type EventoOpt = { id: string; id_evento: string; nome: string; cliente_id: string | null };

const emptyForm = {
  cliente_id: "",
  evento_id: "",
  freelancer_id: "",
  descricao_servico: "",
  data_evento_inicio: "",
  data_evento_fim: "",
  valor: "",
  data_vencimento: "",
  categoria_id: "",
  status_pagamento_id: "",
  data_pagamento: "",
};

const fmtData = (v: string | null) => {
  if (!v) return "—";
  const [y, m, d] = v.split("-");
  return y && m && d ? `${d}/${m}/${y}` : v;
};
const fmtMoeda = (v: number | null) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPeriodo = (a: string | null, b: string | null) =>
  !a && !b ? "—" : `${fmtData(a)} – ${fmtData(b)}`;

export function FreelancerServicoClient() {
  const [registros, setRegistros] = useState<FreelancerServico[]>([]);
  const [eventos, setEventos] = useState<EventoOpt[]>([]);
  const [clientes, setClientes] = useState<Opt[]>([]);
  const [freelancers, setFreelancers] = useState<Opt[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFreelancerOpt[]>([]);
  const [statusRec, setStatusRec] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FreelancerServico | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [regs, evs, cls, frs, cats, srs] = await Promise.all([
        listFreelancerServicos(),
        listEventos(),
        listRows("clientes"),
        listRows("freelancers"),
        listCategoriasFreelancer(),
        listRows("status_recebimento"),
      ]);
      setRegistros(regs);
      setEventos(
        evs.map((e) => ({ id: e.id, id_evento: e.id_evento, nome: e.nome, cliente_id: e.cliente_id })),
      );
      const toOpt = (rows: { id: unknown; nome?: unknown }[]) =>
        rows.map((r) => ({ id: String(r.id), nome: String(r.nome ?? "") }));
      setClientes(toOpt(cls));
      setFreelancers(toOpt(frs));
      setCategorias(cats);
      setStatusRec(toOpt(srs));
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

  function openEdit(s: FreelancerServico) {
    setEditing(s);
    setFormError(null);
    setForm({
      cliente_id: s.cliente_id ?? "",
      evento_id: s.evento_id ?? "",
      freelancer_id: s.freelancer_id ?? "",
      descricao_servico: s.descricao_servico ?? "",
      data_evento_inicio: s.data_evento_inicio ?? "",
      data_evento_fim: s.data_evento_fim ?? "",
      valor: s.valor == null ? "" : String(s.valor),
      data_vencimento: s.data_vencimento ?? "",
      categoria_id: s.categoria_id ?? "",
      status_pagamento_id: s.status_pagamento_id ?? "",
      data_pagamento: s.data_pagamento ?? "",
    });
    setModalOpen(true);
  }

  const eventosDoCliente = form.cliente_id
    ? eventos.filter((e) => e.cliente_id === form.cliente_id)
    : [];
  const idEvento = eventos.find((e) => e.id === form.evento_id)?.id_evento ?? "";
  const planoContas =
    categorias.find((c) => c.id === form.categoria_id)?.grupo_nome ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const payload = {
        cliente_id: form.cliente_id || null,
        evento_id: form.evento_id || null,
        freelancer_id: form.freelancer_id || null,
        descricao_servico: form.descricao_servico.trim() || null,
        data_evento_inicio: form.data_evento_inicio || null,
        data_evento_fim: form.data_evento_fim || null,
        valor: form.valor === "" ? null : Number(form.valor),
        data_vencimento: form.data_vencimento || null,
        categoria_id: form.categoria_id || null,
        status_pagamento_id: form.status_pagamento_id || null,
        data_pagamento: form.data_pagamento || null,
      };
      if (editing) {
        await updateRow("freelancer_servico", editing.id, payload);
      } else {
        await insertRow("freelancer_servico", payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo(s: FreelancerServico) {
    setError(null);
    try {
      await updateRow("freelancer_servico", s.id, { ativo: !s.ativo });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar o status.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir este lançamento?")) return;
    setError(null);
    try {
      await deleteRow("freelancer_servico", id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  const columns: Column<FreelancerServico>[] = [
    { key: "id_evento", header: "ID Evento", render: (s) => s.evento?.id_evento ?? "—" },
    { key: "cliente", header: "Cliente", render: (s) => s.cliente?.nome ?? "—" },
    { key: "evento", header: "Evento", render: (s) => s.evento?.nome ?? "—" },
    { key: "freelancer", header: "Freelancer", render: (s) => s.freelancer?.nome ?? "—" },
    { key: "descricao", header: "Descrição do Serviço", render: (s) => s.descricao_servico ?? "—" },
    { key: "data_evento", header: "Data do Evento", render: (s) => fmtPeriodo(s.data_evento_inicio, s.data_evento_fim) },
    { key: "valor", header: "Valor", render: (s) => fmtMoeda(s.valor) },
    { key: "data_vencimento", header: "Data Vencimento", render: (s) => fmtData(s.data_vencimento) },
    { key: "categoria", header: "Categoria", render: (s) => s.categoria?.nome ?? "—" },
    { key: "plano", header: "Plano de Contas", render: (s) => s.categoria?.grupo?.nome ?? "—" },
    {
      key: "status",
      header: "Status Pagamento",
      render: (s) =>
        s.status ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{s.status.nome}</span>
        ) : (
          "—"
        ),
    },
    { key: "data_pagamento", header: "Data Pagamento", render: (s) => fmtData(s.data_pagamento) },
  ];

  const inputCls =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
  const roCls = "w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Freelancers</h1>
        <p className="text-sm text-slate-500">Serviços de freelancers por evento.</p>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">Serviços</h2>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Adicionar Serviço
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : registros.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm text-slate-500">Nenhum serviço cadastrado.</p>
            <button type="button" onClick={openCreate} className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Adicionar o primeiro
            </button>
          </div>
        ) : (
          <DataTable<FreelancerServico>
            rows={registros}
            getRowKey={(s) => s.id}
            columns={columns}
            actions={(s) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAtivo(s)}
                  title={s.ativo ? "Clique para inativar" : "Clique para ativar"}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                    s.ativo ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-slate-300 text-slate-700 hover:bg-slate-400"
                  }`}
                >
                  {s.ativo ? "Ativo" : "Inativo"}
                </button>
                <button type="button" onClick={() => openEdit(s)} className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-800" aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => handleDelete(s.id)} className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-rose-600" aria-label="Excluir">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          />
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="2xl" title={editing ? "Editar Serviço" : "Novo Serviço"}>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Freelancer</label>
              <select aria-label="Freelancer" value={form.freelancer_id} onChange={(e) => setForm((f) => ({ ...f, freelancer_id: e.target.value }))} className={inputCls}>
                <option value="">Selecione...</option>
                {freelancers.map((fr) => (<option key={fr.id} value={fr.id}>{fr.nome}</option>))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Valor</label>
              <input type="number" min={0} step="0.01" value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Data Vencimento</label>
              <input type="date" value={form.data_vencimento} onChange={(e) => setForm((f) => ({ ...f, data_vencimento: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Data Evento (início)</label>
              <input type="date" value={form.data_evento_inicio} onChange={(e) => setForm((f) => ({ ...f, data_evento_inicio: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Data Evento (fim)</label>
              <input type="date" value={form.data_evento_fim} onChange={(e) => setForm((f) => ({ ...f, data_evento_fim: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Categoria</label>
              <select aria-label="Categoria" value={form.categoria_id} onChange={(e) => setForm((f) => ({ ...f, categoria_id: e.target.value }))} className={inputCls}>
                <option value="">Selecione...</option>
                {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Plano de Contas</label>
              <input disabled value={planoContas || "—"} className={roCls} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status Pagamento</label>
              <select aria-label="Status Pagamento" value={form.status_pagamento_id} onChange={(e) => setForm((f) => ({ ...f, status_pagamento_id: e.target.value }))} className={inputCls}>
                <option value="">Selecione...</option>
                {statusRec.map((s) => (<option key={s.id} value={s.id}>{s.nome}</option>))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Data Pagamento</label>
              <input type="date" value={form.data_pagamento} onChange={(e) => setForm((f) => ({ ...f, data_pagamento: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descrição do Serviço</label>
            <textarea rows={3} value={form.descricao_servico} onChange={(e) => setForm((f) => ({ ...f, descricao_servico: e.target.value }))} className={inputCls} />
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
