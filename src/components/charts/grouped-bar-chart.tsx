export type Serie = { key: string; label: string; color: string };
export type GroupRow = { label: string; values: Record<string, number> };

const fmtMoeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function GroupedBarChart({
  title,
  series,
  rows,
  percent = false,
  money = true,
  baseKey,
}: {
  title: string;
  series: Serie[];
  rows: GroupRow[];
  percent?: boolean;
  money?: boolean;
  /** Em modo %, calcula cada valor em relação a este série (por linha). Se ausente, usa o total da série. */
  baseKey?: string;
}) {
  const allVals = rows.flatMap((r) => series.map((s) => Math.abs(r.values[s.key] ?? 0)));
  const max = Math.max(1, ...allVals);
  const seriesTotal: Record<string, number> = {};
  for (const s of series) {
    seriesTotal[s.key] = rows.reduce((a, r) => a + Math.abs(r.values[s.key] ?? 0), 0) || 1;
  }
  const fmt = (v: number, key: string, row: GroupRow) => {
    if (percent) {
      const base = baseKey ? Math.abs(row.values[baseKey] ?? 0) || 1 : seriesTotal[key];
      return `${((Math.abs(v) / base) * 100).toFixed(1)}%`;
    }
    return money ? fmtMoeda(v) : String(v);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <div className="flex flex-wrap gap-3">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1 text-xs text-slate-500">
              <span className={`h-2.5 w-2.5 rounded-sm ${s.color}`} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">Sem dados.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.label}>
              <p className="mb-1 text-xs font-medium text-slate-700">{row.label}</p>
              <div className="space-y-1.5">
                {series.map((s) => {
                  const val = row.values[s.key] ?? 0;
                  return (
                    <div key={s.key} className="flex items-center gap-2">
                      <span className="w-20 shrink-0 text-[11px] text-slate-500">{s.label}</span>
                      <div className="h-4 flex-1 rounded bg-slate-100">
                        <div
                          className={`h-4 rounded ${s.color}`}
                          style={{ width: `${(Math.abs(val) / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-24 shrink-0 text-right text-xs font-medium text-slate-700">
                        {fmt(val, s.key, row)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
