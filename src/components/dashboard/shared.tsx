"use client";

import { Loader2 } from "lucide-react";
import type { Bar } from "@/components/charts/bar-chart";

/** Agrupa linhas por chave e soma um valor; ordena desc. */
export function agrupar<T>(
  rows: T[],
  key: (r: T) => string,
  val: (r: T) => number,
): Bar[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    m.set(k, (m.get(k) ?? 0) + val(r));
  }
  return Array.from(m, ([label, value]) => ({ label, value })).sort(
    (a, b) => b.value - a.value,
  );
}

export function uniq(arr: (string | null | undefined)[]): string[] {
  return Array.from(new Set(arr.filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b),
  );
}

export const filterCls =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600";

export function Toggle({
  percent,
  setPercent,
}: {
  percent: boolean;
  setPercent: (b: boolean) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-slate-300">
      <button
        type="button"
        onClick={() => setPercent(false)}
        className={`px-3 py-1.5 text-sm font-medium ${
          !percent ? "bg-blue-700 text-white" : "bg-white text-slate-600"
        }`}
      >
        R$
      </button>
      <button
        type="button"
        onClick={() => setPercent(true)}
        className={`px-3 py-1.5 text-sm font-medium ${
          percent ? "bg-blue-700 text-white" : "bg-white text-slate-600"
        }`}
      >
        %
      </button>
    </div>
  );
}

export function LoadBox() {
  return (
    <div className="flex items-center gap-2 px-1 py-10 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      Carregando...
    </div>
  );
}

export function ErrBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {msg}
    </div>
  );
}
