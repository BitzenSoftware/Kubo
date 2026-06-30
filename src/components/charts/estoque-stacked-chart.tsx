export type EstoqueGroup = {
  label: string;
  atual: number;
  alocada: number;
  disponivel: number;
};

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-slate-500">
      <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  );
}

/**
 * Barra empilhada de estoque: a barra azul (Atual) é o container cujo
 * comprimento representa a quantidade atual; dentro dela ficam as fatias
 * Alocada (laranja) + Disponível (verde), que somadas dão o Atual.
 */
export function EstoqueStackedChart({
  title,
  rows,
  percent = false,
}: {
  title: string;
  rows: EstoqueGroup[];
  percent?: boolean;
}) {
  const maxAtual = Math.max(1, ...rows.map((r) => r.atual));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <div className="flex flex-wrap gap-3">
          <Legend color="bg-blue-600" label="Atual" />
          <Legend color="bg-amber-500" label="Alocada" />
          <Legend color="bg-emerald-500" label="Disponível" />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">Sem dados.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const atualW = (r.atual / maxAtual) * 100;
            const alocPct = r.atual > 0 ? (r.alocada / r.atual) * 100 : 0;
            const dispPct = r.atual > 0 ? (r.disponivel / r.atual) * 100 : 0;
            return (
              <div key={r.label} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-xs font-medium text-slate-700" title={r.label}>
                  {r.label}
                </span>

                {/* Trilho cinza ocupa a largura toda; a barra azul = Atual */}
                <div className="h-5 flex-1 rounded bg-slate-100">
                  <div
                    className="flex h-5 items-center rounded bg-blue-600 px-0.5"
                    style={{ width: `${atualW}%` }}
                    title={`Atual: ${r.atual}`}
                  >
                    {/* Empilhado dentro da barra azul: Alocada + Disponível */}
                    <div className="flex h-3 w-full overflow-hidden rounded-sm">
                      <div
                        className="h-3 bg-amber-500"
                        style={{ width: `${alocPct}%` }}
                        title={`Alocada: ${r.alocada}`}
                      />
                      <div
                        className="h-3 bg-emerald-500"
                        style={{ width: `${dispPct}%` }}
                        title={`Disponível: ${r.disponivel}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="w-36 shrink-0 text-right">
                  <span className="text-xs font-semibold text-slate-900">{r.atual}</span>
                  <span className="ml-1.5 text-[11px] text-slate-500">
                    {percent
                      ? `${alocPct.toFixed(0)}% aloc · ${dispPct.toFixed(0)}% disp`
                      : `${r.alocada} aloc · ${r.disponivel} disp`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
