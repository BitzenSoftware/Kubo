"use client";

import { Bell, Search, UserCircle2 } from "lucide-react";

export function Topbar() {
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
        <button
          type="button"
          className="flex items-center gap-2 rounded-md p-1.5 pr-2 text-slate-600 hover:bg-slate-100"
        >
          <UserCircle2 className="h-6 w-6" />
          <span className="text-sm font-medium">Usuário</span>
        </button>
      </div>
    </header>
  );
}
