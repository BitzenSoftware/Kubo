"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { deleteRow, listRows, updateRow } from "@/lib/config-data";
import { listProdutos } from "@/lib/produtos-data";
import { listEstoque } from "@/lib/estoque-data";
import {
  createEvento,
  listEventoStatus,
  listEventos,
  listItens,
  montarIdEvento,
  replaceItens,
  type Evento,
  type EventoStatus,
} from "@/lib/eventos-data";

type Produto = { id: string; codigo: string; nome: string };
type Line = { key: string; produto_id: string; quantidade: number };
type ModalTab = "dados" | "locacao" | "sublocacao";

export function EventosClient() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [statuses, setStatuses] = useState<EventoStatus[]>([]);
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [dispById, setDispById] = useState<Record<string, number>>({});
  // Quantidade que ESTE evento já aloca por produto (para devolver à capacidade ao editar)
  const [ownByProduto, setOwnByProduto] = useState<Record<string, number>>({});
  // Filtros
  const [fNome, setFNome] = useState("");
  const [fCliente, setFCliente] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Evento | null>(null);
  const [tab, setTab] = useState<ModalTab>("dados");
  const [nome, setNome] = useState("");
  const [statusId, setStatusId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [locacao, setLocacao] = useState<Line[]>([]);
  const [sublocacao, setSublocacao] = useState<Line[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [evs, prods, sts, cls, est] = await Promise.all([
        listEventos(),
        listProdutos(),
        listEventoStatus(),
        listRows("clientes"),
        listEstoque(),
      ]);
      setEventos(evs);
      setProdutos(prods.map((p) => ({ id: p.id, codigo: p.codigo, nome: p.nome })));
      setStatuses(sts);
      setClientes(
        cls.map((c) => ({ id: String(c.id), nome: String(c.nome ?? "") })),
      );
      setDispById(
        Object.fromEntries(est.map((e) => [e.id, e.qtd_disponivel])),
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

  function nextSeq(): number {
    return eventos.reduce((m, e) => Math.max(m, e.seq), 0) + 1;
  }

  function openCreate() {
    setEditing(null);
    setTab("dados");
    setNome("");
    setStatusId("");
    setClienteId("");
    setLocacao([]);
    setSublocacao([]);
    setOwnByProduto({});
    setFormError(null);
    setModalOpen(true);
  }

  async function openEdit(ev: Evento) {
    setEditing(ev);
    setTab("dados");
    setNome(ev.nome);
    setStatusId(ev.status_id ?? "");
    setClienteId(ev.cliente_id ?? "");
    setLocacao([]);
    setSublocacao([]);
    setFormError(null);
    setModalOpen(true);
    try {
      const itens = await listItens(ev.id);
      const toLine = (i: { produto_id: string; quantidade: number }): Line => ({
        key: crypto.randomUUID(),
        produto_id: i.produto_id,
        quantidade: i.quantidade,
      });
      const locacaoItens = itens.filter((i) => i.tipo === "locacao");
      setLocacao(locacaoItens.map(toLine));
      setSublocacao(itens.filter((i) => i.tipo === "sublocacao").map(toLine));
      const own: Record<string, number> = {};
      for (const i of locacaoItens) {
        own[i.produto_id] = (own[i.produto_id] ?? 0) + i.quantidade;
      }
      setOwnByProduto(own);
    } catch {
      setFormError("Erro ao carregar os itens do evento.");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!nome.trim()) {
      setFormError("Informe o nome do evento.");
      setTab("dados");
      return;
    }
    if (!clienteId) {
      setFormError("Selecione o cliente.");
      setTab("dados");
      return;
    }
    if ([...locacao, ...sublocacao].some((l) => !l.produto_id)) {
      setFormError("Há uma linha de artigo sem produto selecionado.");
      return;
    }

    setSaving(true);
    try {
      // Validação final de estoque (Locação) com dados frescos do banco
      const est = await listEstoque();
      const freshDisp = Object.fromEntries(
        est.map((e) => [e.id, e.qtd_disponivel]),
      );
      const somaPorProduto: Record<string, number> = {};
      for (const l of locacao) {
        if (!l.produto_id) continue;
        somaPorProduto[l.produto_id] =
          (somaPorProduto[l.produto_id] ?? 0) + (l.quantidade || 0);
      }
      for (const [pid, qtd] of Object.entries(somaPorProduto)) {
        const capacidade = (freshDisp[pid] ?? 0) + (ownByProduto[pid] ?? 0);
        if (qtd > capacidade) {
          const prod = produtos.find((p) => p.id === pid);
          setFormError(
            `Estoque insuficiente para ${prod?.codigo ?? "produto"} — ${prod?.nome ?? ""}: disponível ${capacidade}, solicitado ${qtd}.`,
          );
          setTab("locacao");
          return;
        }
      }

      const status_id = statusId || null;
      const cliente_id = clienteId || null;
      let eventoId: string;
      if (editing) {
        await updateRow("eventos", editing.id, {
          nome: nome.trim(),
          status_id,
          cliente_id,
        });
        eventoId = editing.id;
      } else {
        const seq = nextSeq();
        eventoId = await createEvento({
          id_evento: montarIdEvento(seq),
          seq,
          nome: nome.trim(),
          status_id,
          cliente_id,
        });
      }
      const itens = [
        ...locacao.map((l) => ({
          tipo: "locacao",
          produto_id: l.produto_id,
          quantidade: l.quantidade || 1,
        })),
        ...sublocacao.map((l) => ({
          tipo: "sublocacao",
          produto_id: l.produto_id,
          quantidade: l.quantidade || 1,
        })),
      ];
      await replaceItens(eventoId, itens);
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo(ev: Evento) {
    setError(null);
    try {
      await updateRow("eventos", ev.id, { ativo: !ev.ativo });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar o status.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir este evento (e seus itens)?")) return;
    setError(null);
    try {
      await deleteRow("eventos", id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  // Editor de linhas (artigo + quantidade) reutilizado por Locação e Sublocação
  function renderItens(
    lines: Line[],
    setLines: (fn: (l: Line[]) => Line[]) => void,
    options: Produto[],
    getMax?: (produtoId: string, lineKey: string) => number | undefined,
  ) {
    const add = () =>
      setLines((ls) => [
        ...ls,
        { key: crypto.randomUUID(), produto_id: "", quantidade: 1 },
      ]);
    const update = (key: string, patch: Partial<Line>) =>
      setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    const remove = (key: string) =>
      setLines((ls) => ls.filter((l) => l.key !== key));

    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={add}>
            <Plus className="h-4 w-4" />
            Adicionar artigo
          </Button>
        </div>
        {lines.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Nenhum artigo adicionado.
          </p>
        ) : (
          <div className="space-y-2">
            {lines.map((line) => (
              <div key={line.key} className="flex items-center gap-2">
                <select
                  aria-label="Produto"
                  value={line.produto_id}
                  onChange={(e) => {
                    const pid = e.target.value;
                    const m = getMax?.(pid, line.key);
                    update(line.key, {
                      produto_id: pid,
                      quantidade:
                        m != null
                          ? Math.min(Math.max(1, line.quantidade || 1), Math.max(1, m))
                          : line.quantidade,
                    });
                  }}
                  className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="" disabled>
                    {options.length
                      ? "Selecione o produto..."
                      : "Nenhum produto disponível"}
                  </option>
                  {options.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} — {p.nome}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={getMax?.(line.produto_id, line.key)}
                  aria-label="Quantidade"
                  value={line.quantidade}
                  onChange={(e) => {
                    const m = getMax?.(line.produto_id, line.key);
                    let v = Number(e.target.value);
                    if (!Number.isFinite(v)) v = 1;
                    if (m != null && v > m) v = m;
                    if (v < 1) v = 1;
                    update(line.key, { quantidade: v });
                  }}
                  title={
                    getMax
                      ? `Máximo disponível: ${getMax(line.produto_id, line.key) ?? 0}`
                      : undefined
                  }
                  className="w-20 rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => remove(line.key)}
                  className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Remover"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Locação: só produtos com saldo disponível (mantém os já selecionados nesta locação)
  const selecionadosLocacao = new Set(
    locacao.map((l) => l.produto_id).filter(Boolean),
  );
  const locacaoOptions = produtos.filter(
    (p) => (dispById[p.id] ?? 0) > 0 || selecionadosLocacao.has(p.id),
  );

  // Máximo que uma linha de Locação pode pedir = disponível + o que este evento
  // já alocava do produto − o que outras linhas da locação já pediram do mesmo.
  function getMaxLocacao(produtoId: string, lineKey: string): number | undefined {
    if (!produtoId) return undefined;
    const base = (dispById[produtoId] ?? 0) + (ownByProduto[produtoId] ?? 0);
    const usadoOutras = locacao
      .filter((l) => l.key !== lineKey && l.produto_id === produtoId)
      .reduce((s, l) => s + (l.quantidade || 0), 0);
    return Math.max(0, base - usadoOutras);
  }

  const columns: Column<Evento>[] = [
    { key: "id_evento", header: "ID Evento", render: (e) => e.id_evento },
    { key: "nome", header: "Nome", render: (e) => e.nome },
    {
      key: "cliente",
      header: "Cliente",
      render: (e) => e.cliente?.nome ?? "—",
    },
    {
      key: "status",
      header: "Status",
      render: (e) =>
        e.status ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              e.status.aloca
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {e.status.nome}
          </span>
        ) : (
          "—"
        ),
    },
  ];

  const modalTabs: { id: ModalTab; label: string; count?: number }[] = [
    { id: "dados", label: "Dados" },
    { id: "locacao", label: "Locação", count: locacao.length },
    { id: "sublocacao", label: "Sublocação", count: sublocacao.length },
  ];

  const eventosFiltrados = eventos.filter(
    (e) =>
      e.nome.toLowerCase().includes(fNome.trim().toLowerCase()) &&
      (e.cliente?.nome ?? "").toLowerCase().includes(fCliente.trim().toLowerCase()) &&
      (!fStatus || e.status_id === fStatus),
  );
  const filterInputCls =
    "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Eventos</h1>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">Eventos</h2>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Adicionar Evento
          </Button>
        </div>

        {eventos.length > 0 && (
          <div className="flex flex-wrap gap-3 border-b border-slate-200 px-5 py-3">
            <input value={fNome} onChange={(e) => setFNome(e.target.value)} placeholder="Nome" className={filterInputCls} />
            <input value={fCliente} onChange={(e) => setFCliente(e.target.value)} placeholder="Cliente" className={filterInputCls} />
            <select aria-label="Filtrar status" value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={filterInputCls}>
              <option value="">Todos os status</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
            {(fNome || fCliente || fStatus) && (
              <Button type="button" variant="outline" onClick={() => { setFNome(""); setFCliente(""); setFStatus(""); }}>
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
        ) : eventos.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm text-slate-500">Nenhum evento cadastrado.</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Adicionar o primeiro
            </button>
          </div>
        ) : eventosFiltrados.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-slate-500">
            Nenhum evento para os filtros.
          </div>
        ) : (
          <DataTable<Evento>
            rows={eventosFiltrados}
            getRowKey={(e) => e.id}
            columns={columns}
            actions={(ev) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAtivo(ev)}
                  title={ev.ativo ? "Clique para inativar" : "Clique para ativar"}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                    ev.ativo
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "bg-slate-300 text-slate-700 hover:bg-slate-400"
                  }`}
                >
                  {ev.ativo ? "Ativo" : "Inativo"}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(ev)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-800"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(ev.id)}
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
        size="xl"
        title={editing ? `Editar Evento ${editing.id_evento}` : "Novo Evento"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Abas do modal */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {modalTabs.map((t) => {
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {t.label}
                  {t.count != null && t.count > 0 && (
                    <span
                      className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                        active ? "bg-white/25 text-white" : "bg-white text-slate-500"
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {tab === "dados" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  ID Evento
                </label>
                <input
                  disabled
                  value={editing ? editing.id_evento : montarIdEvento(nextSeq())}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nome do evento
                </label>
                <input
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Cliente
                </label>
                <select
                  required
                  aria-label="Cliente"
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="" disabled>
                    {clientes.length
                      ? "Selecione o cliente..."
                      : "Cadastre um Cliente primeiro"}
                  </option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Status
                </label>
                <select
                  aria-label="Status"
                  value={statusId}
                  onChange={(e) => setStatusId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Sem status</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome} ({s.aloca ? "Aloca" : "Libera"})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  Status que &quot;Aloca&quot; reserva os itens de Locação no
                  estoque.
                </p>
              </div>
            </div>
          )}

          {tab === "locacao" &&
            renderItens(locacao, setLocacao, locacaoOptions, getMaxLocacao)}
          {tab === "sublocacao" &&
            renderItens(sublocacao, setSublocacao, produtos)}

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
              {editing ? "Salvar" : "Criar Evento"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
