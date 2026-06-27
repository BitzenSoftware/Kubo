"use client";

import { useEffect, useRef, useState } from "react";
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
  deleteRow,
  insertRow,
  insertRows,
  listRows,
  updateRow,
  type Row,
} from "@/lib/config-data";
import { downloadSheet, pickByHeader, readSheet, toISODate } from "@/lib/xlsx";

export type SimpleField = {
  key: string;
  label: string;
  type?: "text" | "date" | "number";
  required?: boolean;
  placeholder?: string;
};

export type SimpleCrudConfig = {
  table: string;
  title: string;
  subtitle?: string;
  singular: string;
  fields: SimpleField[];
  /** Campo identificador único (impede duplicados). Se omitido, não há checagem. */
  keyField?: string;
};

function norm(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function formatCell(field: SimpleField, raw: unknown): string {
  const value = raw == null ? "" : String(raw);
  if (field.type === "date" && value) {
    const [y, m, d] = value.split("-");
    if (y && m && d) return `${d}/${m}/${y}`;
  }
  return value || "—";
}

export function SimpleCrud({ config }: { config: SimpleCrudConfig }) {
  const { table, fields, keyField } = config;
  const keyLabel = keyField
    ? (fields.find((f) => f.key === keyField)?.label ?? keyField)
    : undefined;
  // Campo obrigatório usado como referência na importação
  const refKey =
    keyField ?? fields.find((f) => f.required)?.key ?? fields[0]?.key;
  const refLabel = fields.find((f) => f.key === refKey)?.label ?? "Nome";

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRows(await listRows(table));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setForm(Object.fromEntries(fields.map((f) => [f.key, ""])));
    setModalOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setFormError(null);
    setForm(
      Object.fromEntries(
        fields.map((f) => [f.key, row[f.key] == null ? "" : String(row[f.key])]),
      ),
    );
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (keyField) {
      const chave = norm(form[keyField]);
      const dup = rows.some(
        (r) => r.id !== editing?.id && norm(r[keyField]) === chave,
      );
      if (dup) {
        setFormError(`Já existe um registro com esse ${keyLabel}.`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const field of fields) {
        const v = (form[field.key] ?? "").trim();
        payload[field.key] =
          v === "" ? null : field.type === "number" ? Number(v) : v;
      }
      if (editing) {
        await updateRow(table, editing.id, payload);
      } else {
        await insertRow(table, payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setFormError(
        code === "23505"
          ? `Já existe um registro com esse ${keyLabel ?? refLabel}.`
          : err instanceof Error
            ? err.message
            : "Erro ao salvar.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo(row: Row) {
    setError(null);
    try {
      await updateRow(table, row.id, { ativo: row.ativo === false });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar o status.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir este registro?")) return;
    setError(null);
    try {
      await deleteRow(table, id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  // ---- xlsx ----
  function handleTemplate() {
    downloadSheet(`modelo_${table}.xlsx`, [fields.map((f) => f.label)]);
  }

  function handleExport() {
    const data = rows.map((row) =>
      fields.map((f) => formatCell(f, row[f.key])),
    );
    downloadSheet(`${table}.xlsx`, [fields.map((f) => f.label), ...data]);
  }

  async function handleImport(file: File) {
    setImporting(true);
    setError(null);
    setNotice(null);
    try {
      const sheetRows = await readSheet(file);
      const payloads: Record<string, unknown>[] = [];
      let semRef = 0;
      let duplicados = 0;

      const existentes = keyField
        ? new Set(rows.map((r) => norm(r[keyField])))
        : null;
      const vistos = new Set<string>();

      for (const sheetRow of sheetRows) {
        const payload: Record<string, unknown> = {};
        for (const field of fields) {
          const raw = pickByHeader(sheetRow, field.label);
          if (field.type === "date") {
            payload[field.key] = toISODate(raw);
          } else if (field.type === "number") {
            const v = String(raw ?? "").trim();
            payload[field.key] = v === "" ? null : Number(v);
          } else {
            const v = String(raw ?? "").trim();
            payload[field.key] = v === "" ? null : v;
          }
        }
        if (!payload[refKey]) {
          semRef++;
          continue;
        }
        if (keyField) {
          const chave = norm(payload[keyField]);
          if (existentes?.has(chave) || vistos.has(chave)) {
            duplicados++;
            continue;
          }
          vistos.add(chave);
        }
        payloads.push(payload);
      }

      if (payloads.length === 0) {
        const motivos: string[] = [];
        if (duplicados) motivos.push(`${duplicados} duplicado(s)`);
        if (semRef) motivos.push(`${semRef} sem ${refLabel}`);
        setError(
          motivos.length
            ? `Nenhum registro novo para importar (${motivos.join(", ")}).`
            : "Nenhuma linha válida. Verifique se os cabeçalhos batem com o modelo.",
        );
        return;
      }

      await insertRows(table, payloads);
      await load();
      const ignorados: string[] = [];
      if (duplicados) ignorados.push(`${duplicados} duplicado(s)`);
      if (semRef) ignorados.push(`${semRef} sem ${refLabel}`);
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

  const columns: Column<Row>[] = fields.map((f) => ({
    key: f.key,
    header: f.label,
    render: (row) => formatCell(f, row[f.key]),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{config.title}</h1>
        {config.subtitle && (
          <p className="text-sm text-slate-500">{config.subtitle}</p>
        )}
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">{config.title}</h2>
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
              Adicionar {config.singular}
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
            columns={columns}
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${editing ? "Editar" : "Adicionar"} ${config.singular}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {field.label}
              </label>
              <input
                required={field.required || field.key === keyField}
                type={
                  field.type === "date"
                    ? "date"
                    : field.type === "number"
                      ? "number"
                      : "text"
                }
                placeholder={field.placeholder}
                value={form[field.key] ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [field.key]: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          ))}

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
