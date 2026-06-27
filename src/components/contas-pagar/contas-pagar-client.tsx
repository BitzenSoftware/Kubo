"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { deleteRow, insertRow, listRows, updateRow } from "@/lib/config-data";
import { listEventos } from "@/lib/eventos-data";
import {
  listContas,
  listPlanoContas,
  type ContaPagar,
  type PlanoContaOpt,
} from "@/lib/contas-pagar-data";

type Opt = { id: string; nome: string };
type EventoOpt = { id: string; id_evento: string; nome: string };

const emptyForm = {
  data_vencimento: "",
  evento_id: "",
  plano_contas_id: "",
  empresa_id: "",
  fornecedor: "",
  descricao: "",
  valor_total: "",
  status_pagamento_id: "",
  data_pagamento: "",
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

export function ContasPagarClient() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [eventos, setEventos] = useState<EventoOpt[]>([]);
  const [categorias, setCategorias] = useState<PlanoContaOpt[]>([]);
  const [empresas, setEmpresas] = useState<Opt[]>([]);
  const [statuses, setStatuses] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [fCliente, setFCliente] = useState("");
  const [fEvento, setFEvento] = useState("");
  const [fCategoria, setFCategoria] = useState("");
  const [fEmpresa, setFEmpresa] = useState("");
  const [fGrupo, setFGrupo] = useState("");
  const [fFornecedor, setFFornecedor] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fVencDe, setFVencDe] = useState("");
  const [fVencAte, setFVencAte] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContaPagar | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [cts, evs, cats, emps, sts] = await Promise.all([
        listContas(),
        listEventos(),
        listPlanoContas(),
        listRows("empresa"),
        listRows("conta_pagar_status"),
      ]);
      setContas(cts);
      setEventos(
        evs.map((e) => ({ id: e.id, id_evento: e.id_evento, nome: e.nome })),
      );
      setCategorias(cats);
      setEmpresas(
        emps.map((e) => ({ id: String(e.id), nome: String(e.nome ?? "") })),
      );
      setStatuses(
        sts.map((s) => ({ id: String(s.id), nome: String(s.nome ?? "") })),
      );
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

  function openEdit(c: ContaPagar) {
    setEditing(c);
    setFormError(null);
    setForm({
      data_vencimento: c.data_vencimento ?? "",
      evento_id: c.evento_id ?? "",
      plano_contas_id: c.plano_contas_id ?? "",
      empresa_id: c.empresa_id ?? "",
      fornecedor: c.fornecedor ?? "",
      descricao: c.descricao ?? "",
      valor_total: c.valor_total == null ? "" : String(c.valor_total),
      status_pagamento_id: c.status_pagamento_id ?? "",
      data_pagamento: c.data_pagamento ?? "",
    });
    setModalOpen(true);
  }

  const nomeEvento =
    eventos.find((e) => e.id === form.evento_id)?.nome ?? "";
  const grupoNome =
    categorias.find((c) => c.id === form.plano_contas_id)?.grupo_nome ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.data_vencimento) {
      setFormError("Informe a Data de Vencimento.");
      return;
    }
    if (!form.valor_total) {
      setFormError("Informe o Valor Total.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        data_vencimento: form.data_vencimento || null,
        evento_id: form.evento_id || null,
        plano_contas_id: form.plano_contas_id || null,
        empresa_id: form.empresa_id || null,
        fornecedor: form.fornecedor.trim() || null,
        descricao: form.descricao.trim() || null,
        valor_total: form.valor_total === "" ? null : Number(form.valor_total),
        status_pagamento_id: form.status_pagamento_id || null,
        data_pagamento: form.data_pagamento || null,
      };
      if (editing) {
        await updateRow("contas_pagar", editing.id, payload);
      } else {
        await insertRow("contas_pagar", payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo(c: ContaPagar) {
    setError(null);
    try {
      await updateRow("contas_pagar", c.id, { ativo: !c.ativo });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar o status.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir esta conta?")) return;
    setError(null);
    try {
      await deleteRow("contas_pagar", id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  const columns: Column<ContaPagar>[] = [
    { key: "data_vencimento", header: "Vencimento", render: (c) => fmtData(c.data_vencimento) },
    { key: "id_evento", header: "ID Evento", render: (c) => c.evento?.id_evento ?? "—" },
    { key: "nome_evento", header: "Nome Evento", render: (c) => c.evento?.nome ?? "—" },
    { key: "categoria", header: "Categoria", render: (c) => c.categoria?.nome ?? "—" },
    { key: "grupo", header: "Grupo", render: (c) => c.categoria?.grupo?.nome ?? "—" },
    { key: "empresa", header: "Empresa", render: (c) => c.empresa?.nome ?? "—" },
    { key: "fornecedor", header: "Fornecedor", render: (c) => c.fornecedor ?? "—" },
    { key: "valor_total", header: "Valor Total", render: (c) => fmtMoeda(c.valor_total) },
    {
      key: "status",
      header: "Status",
      render: (c) =>
        c.status ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {c.status.nome}
          </span>
        ) : (
          "—"
        ),
    },
    { key: "data_pagamento", header: "Pagamento", render: (c) => fmtData(c.data_pagamento) },
  ];

  function selectCls() {
    return "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
  }
  function readonlyCls() {
    return "w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500";
  }
  const filterCls =
    "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

  const gruposContas = Array.from(
    new Set(categorias.map((c) => c.grupo_nome).filter(Boolean)),
  ) as string[];
  const fornecedores = Array.from(
    new Set(contas.map((c) => c.fornecedor).filter(Boolean)),
  ) as string[];
  const inc = (v: string | null, t: string) =>
    (v ?? "").toLowerCase().includes(t.trim().toLowerCase());
  const contasFiltradas = contas.filter(
    (c) =>
      inc(c.evento?.cliente?.nome ?? "", fCliente) &&
      inc(c.evento?.nome ?? "", fEvento) &&
      (!fCategoria || c.plano_contas_id === fCategoria) &&
      (!fEmpresa || c.empresa_id === fEmpresa) &&
      (!fGrupo || (c.categoria?.grupo?.nome ?? "") === fGrupo) &&
      (!fFornecedor || c.fornecedor === fFornecedor) &&
      (!fStatus || c.status_pagamento_id === fStatus) &&
      (!fVencDe || (c.data_vencimento ?? "") >= fVencDe) &&
      (!fVencAte || (c.data_vencimento ?? "") <= fVencAte),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Contas a Pagar</h1>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">Lançamentos</h2>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Adicionar Conta
          </Button>
        </div>

        {contas.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-3">
            <input value={fCliente} onChange={(e) => setFCliente(e.target.value)} placeholder="Cliente" className={filterCls} />
            <input value={fEvento} onChange={(e) => setFEvento(e.target.value)} placeholder="Evento" className={filterCls} />
            <select aria-label="Filtrar categoria" value={fCategoria} onChange={(e) => setFCategoria(e.target.value)} className={filterCls}>
              <option value="">Todas categorias</option>
              {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
            </select>
            <select aria-label="Filtrar grupo" value={fGrupo} onChange={(e) => setFGrupo(e.target.value)} className={filterCls}>
              <option value="">Todos grupos</option>
              {gruposContas.map((g) => (<option key={g} value={g}>{g}</option>))}
            </select>
            <select aria-label="Filtrar empresa" value={fEmpresa} onChange={(e) => setFEmpresa(e.target.value)} className={filterCls}>
              <option value="">Todas empresas</option>
              {empresas.map((emp) => (<option key={emp.id} value={emp.id}>{emp.nome}</option>))}
            </select>
            <select aria-label="Filtrar fornecedor" value={fFornecedor} onChange={(e) => setFFornecedor(e.target.value)} className={filterCls}>
              <option value="">Todos fornecedores</option>
              {fornecedores.map((f) => (<option key={f} value={f}>{f}</option>))}
            </select>
            <select aria-label="Filtrar status" value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={filterCls}>
              <option value="">Todos status</option>
              {statuses.map((s) => (<option key={s.id} value={s.id}>{s.nome}</option>))}
            </select>
            <label className="flex items-center gap-1 text-sm text-slate-600">
              Vencimento
              <input type="date" aria-label="Vencimento de" value={fVencDe} onChange={(e) => setFVencDe(e.target.value)} className={filterCls} />
              <span>até</span>
              <input type="date" aria-label="Vencimento até" value={fVencAte} onChange={(e) => setFVencAte(e.target.value)} className={filterCls} />
            </label>
            {(fCliente || fEvento || fCategoria || fEmpresa || fGrupo || fFornecedor || fStatus || fVencDe || fVencAte) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFCliente(""); setFEvento(""); setFCategoria(""); setFEmpresa("");
                  setFGrupo(""); setFFornecedor(""); setFStatus(""); setFVencDe(""); setFVencAte("");
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
        ) : contas.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm text-slate-500">Nenhuma conta cadastrada.</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Adicionar a primeira
            </button>
          </div>
        ) : contasFiltradas.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-slate-500">
            Nenhuma conta para os filtros.
          </div>
        ) : (
          <DataTable<ContaPagar>
            rows={contasFiltradas}
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
        title={editing ? "Editar Conta" : "Nova Conta a Pagar"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Data Vencimento
              </label>
              <input
                required
                type="date"
                value={form.data_vencimento}
                onChange={(e) =>
                  setForm((f) => ({ ...f, data_vencimento: e.target.value }))
                }
                className={selectCls()}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                ID Evento
              </label>
              <select
                aria-label="Evento"
                value={form.evento_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, evento_id: e.target.value }))
                }
                className={selectCls()}
              >
                <option value="">Sem evento</option>
                {eventos.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.id_evento} — {ev.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nome Evento
              </label>
              <input disabled value={nomeEvento || "—"} className={readonlyCls()} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Categoria (Plano de Contas)
              </label>
              <select
                aria-label="Categoria"
                value={form.plano_contas_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, plano_contas_id: e.target.value }))
                }
                className={selectCls()}
              >
                <option value="">Selecione...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Grupo Plano de Contas
              </label>
              <input disabled value={grupoNome || "—"} className={readonlyCls()} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Empresa
              </label>
              <select
                aria-label="Empresa"
                value={form.empresa_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, empresa_id: e.target.value }))
                }
                className={selectCls()}
              >
                <option value="">Selecione...</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Fornecedor
              </label>
              <input
                value={form.fornecedor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fornecedor: e.target.value }))
                }
                className={selectCls()}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Valor Total
              </label>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={form.valor_total}
                onChange={(e) =>
                  setForm((f) => ({ ...f, valor_total: e.target.value }))
                }
                className={selectCls()}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Status Pagamento
              </label>
              <select
                aria-label="Status Pagamento"
                value={form.status_pagamento_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status_pagamento_id: e.target.value }))
                }
                className={selectCls()}
              >
                <option value="">Selecione...</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Data Pagamento
              </label>
              <input
                type="date"
                value={form.data_pagamento}
                onChange={(e) =>
                  setForm((f) => ({ ...f, data_pagamento: e.target.value }))
                }
                className={selectCls()}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Descrição Livre
            </label>
            <textarea
              rows={3}
              value={form.descricao}
              onChange={(e) =>
                setForm((f) => ({ ...f, descricao: e.target.value }))
              }
              className={selectCls()}
            />
          </div>

          {formError && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
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
