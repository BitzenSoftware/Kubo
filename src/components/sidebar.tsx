"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { menu } from "@/lib/menu";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-blue-100 bg-blue-50">
      <div className="flex h-14 items-center gap-2 border-b border-blue-100 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-700 text-sm font-bold text-white">
          K
        </div>
        <span className="text-base font-semibold text-slate-900">Kubo ERP</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {menu.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                        active
                          ? "bg-blue-700 font-medium text-white"
                          : "text-slate-700 hover:bg-blue-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          active ? "text-white" : (item.color ?? "text-slate-500")
                        }`}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-blue-100 px-5 py-3 text-xs text-slate-400">
        © Bitzen Software
      </div>
    </aside>
  );
}
