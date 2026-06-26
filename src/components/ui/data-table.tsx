import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  align?: "left" | "right";
};

/**
 * Tabela padrão do sistema.
 * PADRÃO VISUAL (obrigatório em todas as tabelas do ERP):
 *  - Cabeçalho azul (bg-blue-700) com texto branco.
 *  - Linhas zebradas: alternância branco / azul-claro (even:bg-blue-50).
 *  - Coluna "Ações" opcional, alinhada à direita.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  actions,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  actions?: (row: T) => ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-blue-700 text-left text-white">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-5 py-2.5 font-semibold ${
                  c.align === "right" ? "text-right" : ""
                }`}
              >
                {c.header}
              </th>
            ))}
            {actions && (
              <th className="px-5 py-2.5 text-right font-semibold">Ações</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className="border-b border-blue-100 bg-white transition-colors even:bg-blue-50 hover:bg-blue-100/70"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-5 py-3 text-slate-700 ${
                    c.align === "right" ? "text-right" : ""
                  }`}
                >
                  {c.render ? c.render(row) : ((row[c.key as keyof T] as ReactNode) ?? "—")}
                </td>
              ))}
              {actions && <td className="px-5 py-3">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
