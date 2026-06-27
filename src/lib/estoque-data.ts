import { getSupabase } from "./supabase";

export type EstoqueLinha = {
  id: string;
  codigo: string;
  nome: string;
  qtd_atual: number;
  qtd_alocada: number;
  qtd_disponivel: number;
};

type ProdutoRow = { id: string; codigo: string; nome: string; qtd_atual: number | null };
type EventoRow = { id: string; status: { aloca: boolean } | null };
type ItemRow = { produto_id: string; quantidade: number | null; tipo: string; evento_id: string };

export async function listEstoque(): Promise<EstoqueLinha[]> {
  const sb = getSupabase();
  const [prodRes, evRes, itensRes] = await Promise.all([
    sb.from("produtos").select("id, codigo, nome, qtd_atual").order("codigo"),
    sb.from("eventos").select("id, status:status_id(aloca)"),
    sb.from("evento_itens").select("produto_id, quantidade, tipo, evento_id"),
  ]);
  if (prodRes.error) throw prodRes.error;
  if (evRes.error) throw evRes.error;
  if (itensRes.error) throw itensRes.error;

  // Quais eventos alocam (status.aloca = true)
  const alocaByEvento = new Map<string, boolean>();
  for (const ev of (evRes.data ?? []) as unknown as EventoRow[]) {
    alocaByEvento.set(ev.id, !!ev.status?.aloca);
  }

  // Soma das LOCAÇÕES de eventos que alocam, por produto
  const alocadaByProduto = new Map<string, number>();
  for (const it of (itensRes.data ?? []) as unknown as ItemRow[]) {
    if (it.tipo !== "locacao") continue;
    if (!alocaByEvento.get(it.evento_id)) continue;
    alocadaByProduto.set(
      it.produto_id,
      (alocadaByProduto.get(it.produto_id) ?? 0) + (it.quantidade ?? 0),
    );
  }

  return ((prodRes.data ?? []) as unknown as ProdutoRow[]).map((p) => {
    const alocada = alocadaByProduto.get(p.id) ?? 0;
    const atual = p.qtd_atual ?? 0;
    return {
      id: p.id,
      codigo: p.codigo,
      nome: p.nome,
      qtd_atual: atual,
      qtd_alocada: alocada,
      qtd_disponivel: atual - alocada,
    };
  });
}
