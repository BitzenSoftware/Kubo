"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileDown, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { deleteRow, insertRows, updateRow } from "@/lib/config-data";
import {
  listCategorias,
  listProdutos,
  montarCodigo,
  type Categoria,
  type Produto,
} from "@/lib/produtos-data";
import { downloadSheet, pickByHeader, readSheet } from "@/lib/xlsx";

function norm(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

/** Maior sequencial já usado numa categoria (0 se nenhum). */
function maxSeq(produtos: Produto[], categoriaId: string): number {
  return produtos.reduce(
    (m, p) => (p.categoria_id === categoriaId ? Math.max(m, p.seq) : m),
    0,
  );
}

export function ProdutosClient() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [form, setForm] = useState({ categoria_id: "", nome: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Importação
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  // Filtros
  const [fCodigo, setFCodigo] = useState("");
  const [fNome, setFNome] = useState("");
  const [fCategoria, setFCategoria] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [cats, prods] = await Promise.all([listCategorias(), listProdutos()]);
      setCategorias(cats);
      setProdutos(prods);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function categoriaLabel(c: Categoria): string {
    return c.nome ? `${c.nome} (${c.codigo})` : c.codigo;
  }

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setForm({ categoria_id: "", nome: "" });
    setModalOpen(true);
  }

  function openEdit(p: Produto) {
    setEditing(p);
    setFormError(null);
    setForm({ categoria_id: p.categoria_id, nome: p.nome });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const nome = form.nome.trim();
    if (!editing && !form.categoria_id) {
      setFormError("Selecione a categoria.");
      return;
    }
    if (!nome) {
      setFormError("Informe o nome do produto.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        // Edição: apenas o nome (código e categoria são fixos)
        await updateRow("produtos", editing.id, { nome });
      } else {
        const cat = categorias.find((c) => c.id === form.categoria_id);
        if (!cat) {
          setFormError("Categoria inválida.");
          setSaving(false);
          return;
        }
        const seq = maxSeq(produtos, cat.id) + 1;
        const codigo = montarCodigo(cat.codigo, seq);
        await insertRows("produtos", [
          { categoria_id: cat.id, nome, seq, codigo },
        ]);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Erro ao salvar o produto.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo(p: Produto) {
    setError(null);
    try {
      await updateRow("produtos", p.id, { ativo: !p.ativo });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar o status.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir este produto?")) return;
    setError(null);
    try {
      await deleteRow("produtos", id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  // ---- xlsx ----
  function handleTemplate() {
    downloadSheet("modelo_produtos.xlsx", [["Categoria", "Nome"]]);
  }

  function handleExport() {
    const data = produtos.map((p) => [
      p.codigo,
      p.categoria?.codigo ?? "",
      p.nome,
    ]);
    downloadSheet("produtos.xlsx", [["Código", "Categoria", "Nome"], ...data]);
  }

  function resolveCategoria(valor: unknown): Categoria | undefined {
    const v = norm(valor);
    return (
      categorias.find((c) => norm(c.codigo) === v) ??
      categorias.find((c) => norm(c.nome) === v)
    );
  }

  async function handleImport(file: File) {
    setImporting(true);
    setError(null);
    setNotice(null);
    try {
      const rows = await readSheet(file);
      const payloads: Record<string, unknown>[] = [];
      let semCategoria = 0;
      let semNome = 0;

      // Sequencial corrente por categoria (continua do maior já existente)
      const seqByCat: Record<string, number> = {};
      for (const p of produtos) {
        seqByCat[p.categoria_id] = Math.max(
          seqByCat[p.categoria_id] ?? 0,
          p.seq,
        );
      }

      for (const row of rows) {
        const nome = String(pickByHeader(row, "Nome") ?? "").trim();
        const cat = resolveCategoria(pickByHeader(row, "Categoria"));
        if (!cat) {
          semCategoria++;
          continue;
        }
        if (!nome) {
          semNome++;
          continue;
        }
        const seq = (seqByCat[cat.id] ?? 0) + 1;
        seqByCat[cat.id] = seq;
        payloads.push({
          categoria_id: cat.id,
          nome,
          seq,
          codigo: montarCodigo(cat.codigo, seq),
        });
      }

      if (payloads.length === 0) {
        const motivos: string[] = [];
        if (semCategoria) motivos.push(`${semCategoria} sem Categoria válida`);
        if (semNome) motivos.push(`${semNome} sem Nome`);
        setError(
          motivos.length
            ? `Nenhum produto para importar (${motivos.join(", ")}).`
            : "Nenhuma linha válida. Verifique os cabeçalhos (Categoria, Nome).",
        );
        return;
      }

      await insertRows("produtos", payloads);
      await load();
      const ignorados: string[] = [];
      if (semCategoria) ignorados.push(`${semCategoria} sem Categoria`);
      if (semNome) ignorados.push(`${semNome} sem Nome`);
      setNotice(
        `${payloads.length} produto(s) importado(s)` +
          (ignorados.length ? ` — ignorados: ${ignorados.join(", ")}.` : "."),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao importar a planilha.");
    } finally {
      setImporting(false);
    }
  }

  const columns: Column<Produto>[] = [
    { key: "codigo", header: "Código", render: (p) => p.codigo },
    { key: "nome", header: "Nome", render: (p) => p.nome },
    {
      key: "categoria",
      header: "Categoria",
      render: (p) => p.categoria?.nome ?? p.categoria?.codigo ?? "—",
    },
  ];

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.codigo.toLowerCase().includes(fCodigo.trim().toLowerCase()) &&
      p.nome.toLowerCase().includes(fNome.trim().toLowerCase()) &&
      (!fCategoria || p.categoria_id === fCategoria),
  );

  const filterInputCls =
    "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Produtos</h1>
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
          <h2 className="text-sm font-semibold text-slate-900">Produtos</h2>
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
              disabled={produtos.length === 0}
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Adicionar Produto
            </Button>
          </div>
        </div>

        {produtos.length > 0 && (
          <div className="flex flex-wrap gap-3 border-b border-slate-200 px-5 py-3">
            <input value={fCodigo} onChange={(e) => setFCodigo(e.target.value)} placeholder="Código" className={filterInputCls} />
            <input value={fNome} onChange={(e) => setFNome(e.target.value)} placeholder="Nome" className={filterInputCls} />
            <select aria-label="Filtrar categoria" value={fCategoria} onChange={(e) => setFCategoria(e.target.value)} className={filterInputCls}>
              <option value="">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome ? `${c.nome} (${c.codigo})` : c.codigo}</option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : produtos.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm text-slate-500">Nenhum produto cadastrado.</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Adicionar o primeiro
            </button>
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-slate-500">
            Nenhum produto para os filtros.
          </div>
        ) : (
          <DataTable<Produto>
            rows={produtosFiltrados}
            getRowKey={(p) => p.id}
            columns={columns}
            actions={(p) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAtivo(p)}
                  title={p.ativo ? "Clique para inativar" : "Clique para ativar"}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                    p.ativo
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "bg-slate-300 text-slate-700 hover:bg-slate-400"
                  }`}
                >
                  {p.ativo ? "Ativo" : "Inativo"}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-800"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
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
        title={editing ? "Editar Produto" : "Adicionar Produto"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Categoria
            </label>
            {editing ? (
              <input
                disabled
                value={
                  editing.categoria?.nome
                    ? `${editing.categoria.nome} (${editing.categoria.codigo})`
                    : (editing.categoria?.codigo ?? "—")
                }
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
            ) : (
              <select
                required
                aria-label="Categoria"
                value={form.categoria_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoria_id: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="" disabled>
                  {categorias.length
                    ? "Selecione..."
                    : "Cadastre uma Categoria primeiro"}
                </option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {categoriaLabel(c)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {editing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Código
              </label>
              <input
                disabled
                value={editing.codigo}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nome
            </label>
            <input
              required
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {!editing && form.categoria_id && (
            <p className="text-xs text-slate-500">
              Código a ser gerado:{" "}
              <span className="font-semibold text-slate-700">
                {montarCodigo(
                  categorias.find((c) => c.id === form.categoria_id)?.codigo ??
                    "",
                  maxSeq(produtos, form.categoria_id) + 1,
                )}
              </span>
            </p>
          )}

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
