"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  FileDown,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
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
  insertRows,
  listRows,
  updateRow,
  type Row,
} from "@/lib/config-data";
import { downloadSheet, pickByHeader, readSheet, toISODate } from "@/lib/xlsx";

type Option = { id: string; nome: string };

/** Normaliza um nome para comparação de duplicados (sem espaços nas pontas, minúsculo). */
function normNome(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

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
  const [formError, setFormError] = useState<string | null>(null);

  // Importação / exportação xlsx
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const activeTab = configTabById[activeId];
  const keyField = activeTab.keyField ?? "nome";
  const keyLabel =
    activeTab.fields.find((f) => f.key === keyField)?.label ?? "Nome";

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
    setFormError(null);
    setForm(Object.fromEntries(activeTab.fields.map((f) => [f.key, ""])));
    setModalOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setFormError(null);
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
    setFormError(null);

    // Validações por campo (apenas letras / comprimento definido por outro campo)
    for (const field of activeTab.fields) {
      const v = (form[field.key] ?? "").trim();
      if (!v) continue;
      if (field.lettersOnly && !/^[A-Za-zÀ-ÿ]+$/.test(v)) {
        setFormError(`${field.label} deve conter apenas letras.`);
        return;
      }
      if (field.lengthFromField) {
        const len = Number(form[field.lengthFromField] ?? 0);
        if (len > 0 && v.length !== len) {
          setFormError(
            `${field.label} deve ter exatamente ${len} caractere(s).`,
          );
          return;
        }
      }
    }

    // Bloqueia duplicado pelo campo chave da aba (case-insensitive)
    const chave = normNome(form[keyField]);
    const duplicado = rows.some(
      (r) => r.id !== editing?.id && normNome(r[keyField]) === chave,
    );
    if (duplicado) {
      setFormError(`Já existe um registro com esse ${keyLabel} nesta aba.`);
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const field of activeTab.fields) {
        const v = (form[field.key] ?? "").trim();
        if (field.type === "number") {
          payload[field.key] = v === "" ? null : Number(v);
        } else {
          payload[field.key] = v === "" ? null : v;
        }
      }
      if (editing) {
        await updateRow(activeTab.table, editing.id, payload);
      } else {
        await insertRow(activeTab.table, payload);
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      // Backstop: violação do índice único no banco (código 23505)
      const code = (e as { code?: string })?.code;
      setFormError(
        code === "23505"
          ? `Já existe um registro com esse ${keyLabel} nesta aba.`
          : e instanceof Error
            ? e.message
            : "Erro ao salvar.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo(row: Row) {
    const ativo = row.ativo !== false;
    setError(null);
    try {
      await updateRow(activeTab.table, row.id, { ativo: !ativo });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar o status.");
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

  // ---- xlsx: modelo / exportação / importação ----

  /** Baixa um modelo .xlsx só com os cabeçalhos das colunas da aba. */
  function handleTemplate() {
    const headers = activeTab.fields.map((f) => f.label);
    downloadSheet(`modelo_${activeTab.id}.xlsx`, [headers]);
  }

  /** Exporta os registros atuais da aba para .xlsx. */
  function handleExport() {
    const headers = activeTab.fields.map((f) => f.label);
    const data = rows.map((row) =>
      activeTab.fields.map((f) => formatCell(activeTab, row, f.key, options)),
    );
    downloadSheet(`${activeTab.id}.xlsx`, [headers, ...data]);
  }

  /** Importa registros de um .xlsx (cadastro em lote). */
  async function handleImport(file: File) {
    setImporting(true);
    setError(null);
    setNotice(null);
    try {
      const sheetRows = await readSheet(file);
      const payloads: Record<string, unknown>[] = [];
      let semChave = 0;
      let duplicados = 0;

      // Valores-chave já existentes no banco + já vistos neste arquivo (evita duplicados)
      const existentes = new Set(rows.map((r) => normNome(r[keyField])));
      const vistos = new Set<string>();

      for (const sheetRow of sheetRows) {
        const payload: Record<string, unknown> = {};
        for (const field of activeTab.fields) {
          const raw = pickByHeader(sheetRow, field.label);
          if (field.type === "date") {
            payload[field.key] = toISODate(raw);
          } else if (field.type === "number") {
            const v = String(raw ?? "").trim();
            payload[field.key] = v === "" ? null : Number(v);
          } else if (field.type === "select" && field.optionsFrom) {
            const nome = normNome(raw);
            const opt = (options[field.optionsFrom] ?? []).find(
              (o) => normNome(o.nome) === nome,
            );
            payload[field.key] = opt?.id ?? null;
          } else {
            let v = String(raw ?? "").trim();
            if (field.uppercase) v = v.toUpperCase();
            payload[field.key] = v === "" ? null : v;
          }
        }
        // O campo-chave é obrigatório; linhas sem ele são ignoradas
        if (!payload[keyField]) {
          semChave++;
          continue;
        }
        // Ignora duplicados (já no banco ou repetidos no próprio arquivo)
        const chave = normNome(payload[keyField]);
        if (existentes.has(chave) || vistos.has(chave)) {
          duplicados++;
          continue;
        }
        vistos.add(chave);
        payloads.push(payload);
      }

      if (payloads.length === 0) {
        const motivos: string[] = [];
        if (duplicados) motivos.push(`${duplicados} duplicado(s)`);
        if (semChave) motivos.push(`${semChave} sem ${keyLabel}`);
        setError(
          motivos.length
            ? `Nenhum registro novo para importar (${motivos.join(", ")}).`
            : "Nenhuma linha válida encontrada. Verifique se os cabeçalhos batem com o modelo.",
        );
        return;
      }

      await insertRows(activeTab.table, payloads);
      await load();
      const ignorados: string[] = [];
      if (duplicados) ignorados.push(`${duplicados} duplicado(s)`);
      if (semChave) ignorados.push(`${semChave} sem ${keyLabel}`);
      setNotice(
        `${payloads.length} registro(s) importado(s)` +
          (ignorados.length ? ` — ignorados: ${ignorados.join(", ")}.` : "."),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao importar a planilha.");
    } finally {
      setImporting(false);
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
      <div className="flex flex-wrap gap-2">
        {configTabs.map((tab) => {
          const active = tab.id === activeId;
          const count = counts[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveId(tab.id)}
              className={`inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {tab.label}
              {count != null && count > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    active
                      ? "bg-white/25 text-white"
                      : "bg-white text-slate-500"
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
      {notice && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {/* Conteúdo da aba */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">
            {activeTab.label}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              aria-label="Importar planilha xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = "";
              }}
            />
            <Button variant="outline" onClick={handleTemplate}>
              <FileDown className="h-4 w-4" />
              Modelo
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Importar
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={rows.length === 0}
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Adicionar {activeTab.singular}
            </Button>
          </div>
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
            actions={(row) => {
              const ativo = row.ativo !== false;
              return (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAtivo(row)}
                  title={ativo ? "Clique para inativar" : "Clique para ativar"}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                    ativo
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "bg-slate-300 text-slate-700 hover:bg-slate-400"
                  }`}
                >
                  {ativo ? "Ativo" : "Inativo"}
                </button>
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
              );
            }}
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
                    required={field.key === keyField}
                    type={
                      field.type === "date"
                        ? "date"
                        : field.type === "number"
                          ? "number"
                          : "text"
                    }
                    min={field.type === "number" ? 0 : undefined}
                    maxLength={
                      field.lengthFromField
                        ? Number(form[field.lengthFromField]) || undefined
                        : undefined
                    }
                    placeholder={field.placeholder}
                    value={form[field.key] ?? ""}
                    onChange={(e) => {
                      const val = field.uppercase
                        ? e.target.value.toUpperCase()
                        : e.target.value;
                      setForm((f) => ({ ...f, [field.key]: val }));
                    }}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                )}
              </div>
            );
          })}

          {formError && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          )}

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
