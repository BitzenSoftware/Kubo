"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  configTabs,
  configTabById,
  type ConfigTab,
} from "@/lib/configuracoes";

type Row = { id: string } & Record<string, string>;
type Store = Record<string, Row[]>;

const STORAGE_KEY = "kubo:configuracoes";

function loadStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function formatCell(tab: ConfigTab, row: Row, key: string): string {
  const field = tab.fields.find((f) => f.key === key);
  const value = row[key] ?? "";
  if (field?.type === "date" && value) {
    const [y, m, d] = value.split("-");
    if (y && m && d) return `${d}/${m}/${y}`;
  }
  return value || "—";
}

export function ConfigClient() {
  const [store, setStore] = useState<Store>({});
  const [activeId, setActiveId] = useState<string>(configTabs[0].id);
  const [hydrated, setHydrated] = useState(false);

  // Modal de cadastro/edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    setStore(loadStore());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store, hydrated]);

  const activeTab = configTabById[activeId];
  const rows = store[activeId] ?? [];

  const selectOptions = useMemo(() => {
    const opts: Record<string, string[]> = {};
    for (const field of activeTab.fields) {
      if (field.type === "select" && field.optionsFrom) {
        opts[field.key] = (store[field.optionsFrom] ?? [])
          .map((r) => r.nome)
          .filter(Boolean);
      }
    }
    return opts;
  }, [activeTab, store]);

  function openCreate() {
    setEditing(null);
    setForm(Object.fromEntries(activeTab.fields.map((f) => [f.key, ""])));
    setModalOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setForm(
      Object.fromEntries(activeTab.fields.map((f) => [f.key, row[f.key] ?? ""])),
    );
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStore((prev) => {
      const list = prev[activeId] ?? [];
      if (editing) {
        return {
          ...prev,
          [activeId]: list.map((r) =>
            r.id === editing.id ? { ...r, ...form } : r,
          ),
        };
      }
      const newRow: Row = { id: crypto.randomUUID(), ...form };
      return { ...prev, [activeId]: [...list, newRow] };
    });
    setModalOpen(false);
  }

  function handleDelete(id: string) {
    if (!window.confirm("Excluir este registro?")) return;
    setStore((prev) => ({
      ...prev,
      [activeId]: (prev[activeId] ?? []).filter((r) => r.id !== id),
    }));
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
          const count = (store[tab.id] ?? []).length;
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
              {hydrated && count > 0 && (
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

        {rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm text-slate-500">
              Nenhum registro cadastrado.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Adicionar o primeiro
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  {activeTab.fields.map((f) => (
                    <th key={f.key} className="px-5 py-2.5 font-medium">
                      {f.label}
                    </th>
                  ))}
                  <th className="px-5 py-2.5 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    {activeTab.fields.map((f) => (
                      <td key={f.key} className="px-5 py-3 text-slate-700">
                        {formatCell(activeTab, row, f.key)}
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de cadastro/edição */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${editing ? "Editar" : "Adicionar"} ${activeTab.singular}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab.fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {field.label}
              </label>
              {field.type === "select" ? (
                <select
                  required
                  value={form[field.key] ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [field.key]: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="" disabled>
                    {selectOptions[field.key]?.length
                      ? "Selecione..."
                      : "Cadastre um Grupo do Plano primeiro"}
                  </option>
                  {selectOptions[field.key]?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required
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
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">{editing ? "Salvar" : "Adicionar"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
