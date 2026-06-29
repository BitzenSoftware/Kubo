export type Bar = {
  label: string;
  value: number;
  /** Rótulo customizado no modo R$ (sobrepõe o valor formatado). */
  subMoney?: string;
  /** Rótulo customizado no modo % (sobrepõe a porcentagem calculada). */
  subPercent?: string;
};

const fmtMoeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function BarChart({
  title,
  data,
  orientation = "vertical",
  percent = false,
}: {
  title: string;
  data: Bar[];
  orientation?: "vertical" | "horizontal";
  percent?: boolean;
}) {
  const total = data.reduce((a, b) => a + Math.abs(b.value), 0) || 1;
  const max = Math.max(1, ...data.map((d) => Math.abs(d.value)));
  const fmt = (v: number) =>
    percent ? `${((Math.abs(v) / total) * 100).toFixed(1)}%` : fmtMoeda(v);
  const display = (d: Bar) =>
    percent ? (d.subPercent ?? fmt(d.value)) : (d.subMoney ?? fmt(d.value));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">Sem dados.</p>
      ) : orientation === "vertical" ? (
        <div className="flex h-60 items-end gap-2 overflow-x-auto pb-1">
          {data.map((d) => (
            <div
              key={d.label}
              className="flex min-w-[3rem] flex-1 flex-col items-center justify-end gap-1"
              title={`${d.label}: ${display(d)}`}
            >
              <span className="text-[10px] font-medium text-slate-600">
                {display(d)}
              </span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400"
                style={{
                  height: `${(Math.abs(d.value) / max) * 100}%`,
                  minHeight: d.value ? 4 : 0,
                }}
              />
              <span className="w-full truncate text-center text-[10px] text-slate-500">
                {d.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((d) => (
            <div
              key={d.label}
              className="flex items-center gap-2"
              title={`${d.label}: ${display(d)}`}
            >
              <span className="w-36 shrink-0 truncate text-xs text-slate-600">
                {d.label}
              </span>
              <div className="h-5 flex-1 rounded bg-slate-100">
                <div
                  className="h-5 rounded bg-gradient-to-r from-blue-500 to-blue-600"
                  style={{ width: `${(Math.abs(d.value) / max) * 100}%` }}
                />
              </div>
              <span className="w-32 shrink-0 text-right text-xs font-medium text-slate-700">
                {display(d)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
