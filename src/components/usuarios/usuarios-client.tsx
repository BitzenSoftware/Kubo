"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { ACCESS_TREE, subKey } from "@/lib/access";

type Usuario = {
  id: string;
  nome: string;
  is_admin: boolean;
  must_change_password: boolean;
  permissoes: string[];
  ativo: boolean;
};

async function authFetch(url: string, method: string, body?: unknown) {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token ?? "";
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Erro na operação.");
  return json;
}

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600";

export function UsuariosClient() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [tab, setTab] = useState<"dados" | "acessos">("dados");
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const [perms, setPerms] = useState<Set<string>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await getSupabase()
        .from("usuarios")
        .select("id, nome, is_admin, must_change_password, permissoes, ativo")
        .order("nome", { ascending: true });
      if (error) throw error;
      setRows((data as Usuario[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.is_admin) load();
    else setLoading(false);
  }, [user]);

  if (!user?.is_admin) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Apenas administradores podem acessar Utilizadores.
      </div>
    );
  }

  function openCreate() {
    setEditing(null);
    setTab("dados");
    setNome("");
    setSenha("");
    setIsAdmin(false);
    setAtivo(true);
    setPerms(new Set());
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(u: Usuario) {
    setEditing(u);
    setTab("dados");
    setNome(u.nome);
    setSenha("");
    setIsAdmin(u.is_admin);
    setAtivo(u.ativo);
    setPerms(new Set(u.permissoes ?? []));
    setFormError(null);
    setModalOpen(true);
  }

  function toggle(key: string) {
    setPerms((p) => {
      const n = new Set(p);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!nome.trim()) return setFormError("Informe o nome.");
    if (!editing && senha.length < 6)
      return setFormError("A senha padrão deve ter pelo menos 6 caracteres.");
    setSaving(true);
    try {
      const permissoes = Array.from(perms);
      if (editing) {
        const body: Record<string, unknown> = {
          nome: nome.trim(),
          is_admin: isAdmin,
          ativo,
          permissoes,
        };
        if (senha) body.senha = senha;
        await authFetch(`/api/usuarios/${editing.id}`, "PATCH", body);
      } else {
        await authFetch("/api/usuarios", "POST", {
          nome: nome.trim(),
          senha,
          is_admin: isAdmin,
          permissoes,
        });
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo(u: Usuario) {
    setError(null);
    try {
      await authFetch(`/api/usuarios/${u.id}`, "PATCH", { ativo: !u.ativo });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar o status.");
    }
  }

  async function handleDelete(u: Usuario) {
    if (u.id === user?.id) return alert("Você não pode excluir o próprio usuário.");
    if (!window.confirm(`Excluir o usuário ${u.nome}?`)) return;
    setError(null);
    try {
      await authFetch(`/api/usuarios/${u.id}`, "DELETE");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  const columns: Column<Usuario>[] = [
    { key: "nome", header: "Nome", render: (u) => u.nome },
    { key: "perfil", header: "Perfil", render: (u) => (u.is_admin ? "Administrador" : "Usuário") },
    {
      key: "primeiro",
      header: "1º acesso",
      render: (u) => (u.must_change_password ? "Pendente" : "—"),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Utilizadores</h1>
        <p className="text-sm text-slate-500">Cadastro de usuários e acessos.</p>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">Usuários</h2>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Adicionar Usuário
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-slate-500">Nenhum usuário.</div>
        ) : (
          <DataTable<Usuario>
            rows={rows}
            getRowKey={(u) => u.id}
            columns={columns}
            actions={(u) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAtivo(u)}
                  title={u.ativo ? "Clique para inativar" : "Clique para ativar"}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                    u.ativo ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-slate-300 text-slate-700 hover:bg-slate-400"
                  }`}
                >
                  {u.ativo ? "Ativo" : "Inativo"}
                </button>
                <button type="button" onClick={() => openEdit(u)} className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-800" aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => handleDelete(u)} className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-rose-600" aria-label="Excluir">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          />
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="2xl" title={editing ? `Editar ${editing.nome}` : "Novo Usuário"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {(["dados", "acessos"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  tab === t ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t === "dados" ? "Dados" : "Acessos"}
              </button>
            ))}
          </div>

          {tab === "dados" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nome (login)</label>
                <input value={nome} onChange={(e) => setNome(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {editing ? "Nova senha (opcional)" : "Senha padrão"}
                </label>
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className={inputCls} placeholder={editing ? "Deixe em branco para manter" : "Mín. 6 caracteres"} />
                {!editing && (
                  <p className="mt-1 text-xs text-slate-400">O usuário troca a senha no primeiro acesso.</p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600" />
                Administrador (acesso total)
              </label>
              {editing && (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600" />
                  Ativo
                </label>
              )}
            </div>
          )}

          {tab === "acessos" && (
            <div className="space-y-3">
              {isAdmin ? (
                <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  Administrador tem acesso a todos os menus e abas.
                </p>
              ) : (
                <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
                  {ACCESS_TREE.map((m) => (
                    <div key={m.href} className="rounded-md border border-slate-200 p-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                        <input type="checkbox" checked={perms.has(m.href)} onChange={() => toggle(m.href)} className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600" />
                        {m.label}
                      </label>
                      {m.subs && (
                        <div className="mt-2 grid grid-cols-2 gap-1 pl-6 sm:grid-cols-3">
                          {m.subs.map((s) => (
                            <label key={s.id} className="flex items-center gap-2 text-xs text-slate-600">
                              <input type="checkbox" checked={perms.has(subKey(m.href, s.id))} onChange={() => toggle(subKey(m.href, s.id))} className="h-3.5 w-3.5 rounded border-slate-300 text-blue-700 focus:ring-blue-600" />
                              {s.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {formError && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
