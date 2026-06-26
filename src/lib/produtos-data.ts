import { getSupabase } from "./supabase";

export type Categoria = {
  id: string;
  nome: string | null;
  codigo: string;
  ativo?: boolean;
};

export type Produto = {
  id: string;
  categoria_id: string;
  codigo: string;
  nome: string;
  seq: number;
  ativo: boolean;
  categoria: { codigo: string; nome: string | null } | null;
};

/** Monta o código completo do produto: PREFIXO + sequencial de 6 dígitos. */
export function montarCodigo(codigoCategoria: string, seq: number): string {
  return `${codigoCategoria}${String(seq).padStart(6, "0")}`;
}

export async function listCategorias(): Promise<Categoria[]> {
  const { data, error } = await getSupabase()
    .from("categoria")
    .select("id, nome, codigo, ativo")
    .order("codigo", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Categoria[];
}

export async function listProdutos(): Promise<Produto[]> {
  const { data, error } = await getSupabase()
    .from("produtos")
    .select(
      "id, categoria_id, codigo, nome, seq, ativo, categoria(codigo, nome)",
    )
    .order("codigo", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Produto[];
}
