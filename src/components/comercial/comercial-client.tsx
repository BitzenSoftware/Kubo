"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { deleteRow, insertRow, listRows, updateRow } from "@/lib/config-data";
import { listEventos } from "@/lib/eventos-data";
import { listComercial, type Comercial } from "@/lib/comercial-data";
import { criarFaturamentoDeComercial } from "@/lib/faturamento-data";

type Opt = { id: string; nome: string };
type EventoOpt = { id: string; id_evento: string; nome: string; cliente_id: string | null };

const emptyForm = {
  data_pedido: "",
  status_comercial_id: "",
  cliente_id: "",
  evento_id: "",
  agencia: "",
  responsavel: "",
  local: "",
  data_evento_inicio: "",
  data_evento_fim: "",
  vendedor_id: "",
  valor_orcado: "",
  versao_id: "",
  empresa_id: "",
};

function fmtData(v: string | null): string {
  if (!v) return "—";
  const [y, m, d] = v.split("-");
  return y && m && d ? `${d}/${m}/${y}` : v;
}

function fmtMoeda(v: number | null): string {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtPeriodo(ini: string | null, fim: string | null): string {
  if (!ini && !fim) return "—";
  return `${fmtData(ini)} – ${fmtData(fim)}`;
}

export function ComercialClient() {
  const [registros, setRegistros] = useState<Comercial[]>([]);
  const [eventos, setEventos] = useState<EventoOpt[]>([]);
  const [clientes, setClientes] = useState<Opt[]>([]);
  const [statuses, setStatuses] = useState<Opt[]>([]);
  const [vendedores, setVendedores] = useState<Opt[]>([]);
  const [versoes, setVersoes] = useState<Opt[]>([]);
  const [empresas, setEmpresas] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Comercial | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [regs, evs, cls, sts, vds, vrs, emps] = await Promise.all([
        listComercial(),
        listEventos(),
        listRows("clientes"),
        listRows("status_comercial"),
        listRows("vendedor"),
        listRows("versao"),
        listRows("empresa"),
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
      setStatuses(toOpt(sts));
      setVendedores(toOpt(vds));
      setVersoes(toOpt(vrs));
      setEmpresas(toOpt(emps));
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

  function openEdit(c: Comercial) {
    setEditing(c);
    setFormError(null);
    setForm({
      data_pedido: c.data_pedido ?? "",
      status_comercial_id: c.status_comercial_id ?? "",
      cliente_id: c.cliente_id ?? "",
      evento_id: c.evento_id ?? "",
      agencia: c.agencia ?? "",
      responsavel: c.responsavel ?? "",
      local: c.local ?? "",
      data_evento_inicio: c.data_evento_inicio ?? "",
      data_evento_fim: c.data_evento_fim ?? "",
      vendedor_id: c.vendedor_id ?? "",
      valor_orcado: c.valor_orcado == null ? "" : String(c.valor_orcado),
      versao_id: c.versao_id ?? "",
      empresa_id: c.empresa_id ?? "",
    });
    setModalOpen(true);
  }

  // Eventos filtrados pelo cliente selecionado
  const eventosDoCliente = form.cliente_id
    ? eventos.filter((e) => e.cliente_id === form.cliente_id)
    : [];
  const idEvento = eventos.find((e) => e.id === form.evento_id)?.id_evento ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.data_pedido) {
      setFormError("Informe a Data do Pedido.");
      return;
    }
    if (
      form.evento_id &&
      registros.some((r) => r.evento_id === form.evento_id && r.id !== editing?.id)
    ) {
      setFormError("Já existe um pedido comercial para este evento.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        data_pedido: form.data_pedido || null,
        status_comercial_id: form.status_comercial_id || null,
        cliente_id: form.cliente_id || null,
        evento_id: form.evento_id || null,
        agencia: form.agencia.trim() || null,
        responsavel: form.responsavel.trim() || null,
        local: form.local.trim() || null,
        data_evento_inicio: form.data_evento_inicio || null,
        data_evento_fim: form.data_evento_fim || null,
        vendedor_id: form.vendedor_id || null,
        valor_orcado: form.valor_orcado === "" ? null : Number(form.valor_orcado),
        versao_id: form.versao_id || null,
        empresa_id: form.empresa_id || null,
      };
      if (editing) {
        await updateRow("comercial", editing.id, payload);
      } else {
        await insertRow("comercial", payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo(c: Comercial) {
    setError(null);
    try {
      await updateRow("comercial", c.id, { ativo: !c.ativo });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar o status.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir este registro?")) return;
    setError(null);
    try {
      await deleteRow("comercial", id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  async function handleCriarFaturamento(c: Comercial) {
    if (!window.confirm("Criar um Faturamento a partir deste pedido?")) return;
    setError(null);
    setNotice(null);
    try {
      await criarFaturamentoDeComercial({
        evento_id: c.evento_id,
        cliente_id: c.cliente_id,
        valor_orcado: c.valor_orcado,
        empresa_id: c.empresa_id,
      });
      setNotice(
        "Faturamento criado (status Pendente). Abra o menu Faturamento e edite os campos restantes.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar o faturamento.");
    }
  }

  const columns: Column<Comercial>[] = [
    { key: "id_evento", header: "ID Evento", render: (c) => c.evento?.id_evento ?? "—" },
    { key: "data_pedido", header: "Data Pedido", render: (c) => fmtData(c.data_pedido) },
    {
      key: "status",
      header: "Status Comercial",
      render: (c) =>
        c.status ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {c.status.nome}
          </span>
        ) : (
          "—"
        ),
    },
    { key: "cliente", header: "Cliente", render: (c) => c.cliente?.nome ?? "—" },
    { key: "evento", header: "Evento", render: (c) => c.evento?.nome ?? "—" },
    { key: "agencia", header: "Agência", render: (c) => c.agencia ?? "—" },
    { key: "responsavel", header: "Responsável", render: (c) => c.responsavel ?? "—" },
    { key: "local", header: "Local", render: (c) => c.local ?? "—" },
    { key: "empresa", header: "Empresa", render: (c) => c.empresa?.nome ?? "—" },
    {
      key: "data_evento",
      header: "Data Evento",
      render: (c) => fmtPeriodo(c.data_evento_inicio, c.data_evento_fim),
    },
    { key: "vendedor", header: "Vendedor", render: (c) => c.vendedor?.nome ?? "—" },
    { key: "valor_orcado", header: "Valor Orçado", render: (c) => fmtMoeda(c.valor_orcado) },
    { key: "versao", header: "Obs/Versão", render: (c) => c.versao?.nome ?? "—" },
  ];

  const inputCls =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
  const readonlyCls =
    "w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Comercial</h1>
        <p className="text-sm text-slate-500">Pedidos comerciais.</p>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">Pedidos</h2>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Adicionar Pedido
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : registros.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm text-slate-500">Nenhum pedido cadastrado.</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Adicionar o primeiro
            </button>
          </div>
        ) : (
          <DataTable<Comercial>
            rows={registros}
            getRowKey={(c) => c.id}
            columns={columns}
            actions={(c) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAtivo(c)}
                  title={c.ativo ? "Clique para inativar" : "Clique para ativar"}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                    c.ativo
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "bg-slate-300 text-slate-700 hover:bg-slate-400"
                  }`}
                >
                  {c.ativo ? "Ativo" : "Inativo"}
                </button>
                <button
                  type="button"
                  onClick={() => handleCriarFaturamento(c)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-indigo-600"
                  aria-label="Criar Faturamento"
                  title="Criar Faturamento"
                >
                  <Receipt className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-800"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-rose-600"
                  aria-label="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="2xl"
        title={editing ? "Editar Pedido" : "Novo Pedido"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Data Pedido</label>
              <input
                required
                type="date"
                value={form.data_pedido}
                onChange={(e) => setForm((f) => ({ ...f, data_pedido: e.target.value }))}
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status Comercial</label>
              <select
                aria-label="Status Comercial"
                value={form.status_comercial_id}
                onChange={(e) => setForm((f) => ({ ...f, status_comercial_id: e.target.value }))}
                className={inputCls}
              >
                <option value="">Selecione...</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Cliente</label>
              <select
                aria-label="Cliente"
                value={form.cliente_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cliente_id: e.target.value, evento_id: "" }))
                }
                className={inputCls}
              >
                <option value="">Selecione...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Evento</label>
              <select
                aria-label="Evento"
                value={form.evento_id}
                disabled={!form.cliente_id}
                onChange={(e) => setForm((f) => ({ ...f, evento_id: e.target.value }))}
                className={form.cliente_id ? inputCls : readonlyCls}
              >
                <option value="">
                  {!form.cliente_id
                    ? "Selecione o cliente primeiro"
                    : eventosDoCliente.length
                      ? "Selecione..."
                      : "Cliente sem eventos"}
                </option>
                {eventosDoCliente.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.id_evento} — {ev.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">ID Evento</label>
              <input disabled value={idEvento || "—"} className={readonlyCls} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Agência</label>
              <input
                value={form.agencia}
                onChange={(e) => setForm((f) => ({ ...f, agencia: e.target.value }))}
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Responsável</label>
              <input
                value={form.responsavel}
                onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))}
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Local</label>
              <input
                value={form.local}
                onChange={(e) => setForm((f) => ({ ...f, local: e.target.value }))}
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Empresa</label>
              <select
                aria-label="Empresa"
                value={form.empresa_id}
                onChange={(e) => setForm((f) => ({ ...f, empresa_id: e.target.value }))}
                className={inputCls}
              >
                <option value="">Selecione...</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Data Evento (início)</label>
              <input
                type="date"
                value={form.data_evento_inicio}
                onChange={(e) => setForm((f) => ({ ...f, data_evento_inicio: e.target.value }))}
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Data Evento (fim)</label>
              <input
                type="date"
                value={form.data_evento_fim}
                onChange={(e) => setForm((f) => ({ ...f, data_evento_fim: e.target.value }))}
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Vendedor</label>
              <select
                aria-label="Vendedor"
                value={form.vendedor_id}
                onChange={(e) => setForm((f) => ({ ...f, vendedor_id: e.target.value }))}
                className={inputCls}
              >
                <option value="">Selecione...</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>{v.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Valor Orçado</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.valor_orcado}
                onChange={(e) => setForm((f) => ({ ...f, valor_orcado: e.target.value }))}
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Obs/Versão</label>
              <select
                aria-label="Versão"
                value={form.versao_id}
                onChange={(e) => setForm((f) => ({ ...f, versao_id: e.target.value }))}
                className={inputCls}
              >
                <option value="">Selecione...</option>
                {versoes.map((v) => (
                  <option key={v.id} value={v.id}>{v.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
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
