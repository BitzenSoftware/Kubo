"use client";

import { Bell, LogOut, Search, UserCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Buscar..."
          className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-slate-600">
          <UserCircle2 className="h-6 w-6" />
          <span className="text-sm font-medium">{user?.nome ?? "Usuário"}</span>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
          aria-label="Sair"
          title="Sair"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
