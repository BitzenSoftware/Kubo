"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const r = await login(nome, senha);
    setLoading(false);
    if (r) {
      setErr(r);
      return;
    }
    router.replace("/dashboard");
  }

  const inputCls =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600";

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-50 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-700 text-sm font-bold text-white">K</div>
          <span className="text-lg font-semibold text-slate-900">Kubo ERP</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Utilizador</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" className={inputCls} autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Senha</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className={inputCls} />
          </div>
          {err && <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </div>
      </form>
    </div>
  );
}
