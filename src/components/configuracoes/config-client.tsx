"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import {
  configTabs,
  configTabById,
  type ConfigTab,
} from "@/lib/configuracoes";
import {
  deleteRow,
  insertRow,
  listRows,
  updateRow,
  type Row,
} from "@/lib/config-data";

type Option = { id: string; nome: string };

function formatCell(
  tab: ConfigTab,
  row: Row,
  key: string,
  options: Record<string, Option[]>,
): string {
  const field = tab.fields.find((f) => f.key === key);
  const raw = row[key];

  if (field?.type === "select" && field.optionsFrom) {
    const opt = (options[field.optionsFrom] ?? []).find((o) => o.id === raw);
    return opt?.nome ?? "—";
  }

  const value = raw == null ? "" : String(raw);
  if (field?.type === "date" && value) {
    const [y, m, d] = value.split("-");
    if (y && m && d) return `${d}/${m}/${y}`;
  }
  return value || "—";
}

export function ConfigClient() {
  const [activeId, setActiveId] = useState<string>(configTabs[0].id);
  const [rows, setRows] = useState<Row[]>([]);
  const [options, setOptions] = useState<Record<string, Option[]>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de cadastro/edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const activeTab = configTabById[activeId];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRows(activeTab.table);
      setRows(data);
      setCounts((c) => ({ ...c, [activeId]: data.length }));

      // Carrega opções para os campos do tipo "select"
      const opts: Record<string, Option[]> = {};
      for (const field of activeTab.fields) {
        if (field.type === "select" && field.optionsFrom) {
          const refTab = configTabById[field.optionsFrom];
          const refRows = await listRows(refTab.table);
          opts[field.optionsFrom] = refRows.map((r) => ({
            id: String(r.id),
            nome: String(r.nome ?? ""),
          }));
        }
      }
      setOptions(opts);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erro ao carregar os dados do banco.",
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeId, activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(Object.fromEntries(activeTab.fields.map((f) => [f.key, ""])));
    setModalOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setForm(
      Object.fromEntries(
        activeTab.fields.map((f) => [
          f.key,
          row[f.key] == null ? "" : String(row[f.key]),
        ]),
      ),
    );
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const field of activeTab.fields) {
        const v = (form[field.key] ?? "").trim();
        payload[field.key] = v === "" ? null : v;
      }
      if (editing) {
        await updateRow(activeTab.table, editing.id, payload);
      } else {
        await insertRow(activeTab.table, payload);
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir este registro?")) return;
    setError(null);
    try {
      await deleteRow(activeTab.table, id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500">
          Cadastros base do sistema, organizados por aba.
        </p>
      </div>

      {/* Abas */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-px">
        {configTabs.map((tab) => {
          const active = tab.id === activeId;
          const count = counts[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveId(tab.id)}
              className={`rounded-t-md px-3.5 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-white text-indigo-600 shadow-[inset_0_-2px_0_0_theme(colors.indigo.600)]"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              {tab.label}
              {count != null && count > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                    active
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Conteúdo da aba */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">
            {activeTab.label}
          </h2>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Adicionar {activeTab.singular}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm text-slate-500">Nenhum registro cadastrado.</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Adicionar o primeiro
            </button>
          </div>
        ) : (
          <DataTable<Row>
            rows={rows}
            getRowKey={(row) => row.id}
            columns={activeTab.fields.map<Column<Row>>((f) => ({
              key: f.key,
              header: f.label,
              render: (row) => formatCell(activeTab, row, f.key, options),
            }))}
            actions={(row) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(row)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-800"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(row.id)}
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

      {/* Modal de cadastro/edição */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${editing ? "Editar" : "Adicionar"} ${activeTab.singular}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab.fields.map((field) => {
            const opts = field.optionsFrom ? options[field.optionsFrom] ?? [] : [];
            return (
              <div key={field.key}>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <select
                    required
                    aria-label={field.label}
                    value={form[field.key] ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [field.key]: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="" disabled>
                      {opts.length
                        ? "Selecione..."
                        : "Cadastre um Grupo do Plano primeiro"}
                    </option>
                    {opts.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.nome}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    required={field.key === "nome"}
                    type={field.type === "date" ? "date" : "text"}
                    placeholder={field.placeholder}
                    value={form[field.key] ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [field.key]: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                )}
              </div>
            );
          })}

          <div className="flex justify-end gap-2 pt-2">
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
