import * as XLSX from "xlsx";

/** Gera e baixa uma planilha .xlsx a partir de uma matriz (linhas x colunas). */
export function downloadSheet(
  filename: string,
  aoa: (string | number | null)[][],
): void {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados");
  XLSX.writeFile(wb, filename);
}

/** Lê o primeiro sheet de um arquivo .xlsx e devolve as linhas como objetos por cabeçalho. */
export async function readSheet(
  file: File,
): Promise<Record<string, unknown>[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
}

/** Lê um valor de uma linha pelo cabeçalho, tolerante a maiúsculas/espaços. */
export function pickByHeader(
  row: Record<string, unknown>,
  header: string,
): unknown {
  const target = header.trim().toLowerCase();
  for (const key of Object.keys(row)) {
    if (key.trim().toLowerCase() === target) return row[key];
  }
  return "";
}

/** Converte valores de data (Date do Excel, dd/mm/aaaa ou aaaa-mm-dd) para ISO aaaa-mm-dd. */
export function toISODate(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const v = String(value).trim();
  const br = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
