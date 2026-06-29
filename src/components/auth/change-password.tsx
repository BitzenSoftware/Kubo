"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function ChangePasswordScreen() {
  const { changePassword, logout, user } = useAuth();
  const [s1, setS1] = useState("");
  const [s2, setS2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (s1.length < 6) return setErr("A senha deve ter pelo menos 6 caracteres.");
    if (s1 !== s2) return setErr("As senhas não conferem.");
    setLoading(true);
    const r = await changePassword(s1);
    setLoading(false);
    if (r) setErr(r);
  }

  const inputCls =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600";

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-50 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Defina uma nova senha</h1>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          Olá {user?.nome}. No primeiro acesso é necessário trocar a senha padrão.
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nova senha</label>
            <input type="password" value={s1} onChange={(e) => setS1(e.target.value)} className={inputCls} autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirmar senha</label>
            <input type="password" value={s2} onChange={(e) => setS2(e.target.value)} className={inputCls} />
          </div>
          {err && <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar nova senha
          </Button>
          <button type="button" onClick={() => logout()} className="w-full text-center text-sm text-slate-500 hover:text-slate-700">
            Sair
          </button>
        </div>
      </form>
    </div>
  );
}
