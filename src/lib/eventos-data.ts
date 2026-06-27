import { getSupabase } from "./supabase";

export type Evento = {
  id: string;
  id_evento: string;
  seq: number;
  nome: string;
  ativo: boolean;
};

export type EventoItem = {
  id: string;
  evento_id: string;
  tipo: "locacao" | "sublocacao";
  produto_id: string;
  quantidade: number;
};

/** Monta o ID do evento: EV- + sequencial de 6 dígitos. */
export function montarIdEvento(seq: number): string {
  return `EV-${String(seq).padStart(6, "0")}`;
}

export async function listEventos(): Promise<Evento[]> {
  const { data, error } = await getSupabase()
    .from("eventos")
    .select("id, id_evento, seq, nome, ativo")
    .order("seq", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Evento[];
}

export async function listItens(eventoId: string): Promise<EventoItem[]> {
  const { data, error } = await getSupabase()
    .from("evento_itens")
    .select("id, evento_id, tipo, produto_id, quantidade")
    .eq("evento_id", eventoId);
  if (error) throw error;
  return (data ?? []) as EventoItem[];
}

export async function createEvento(values: {
  id_evento: string;
  seq: number;
  nome: string;
}): Promise<string> {
  const { data, error } = await getSupabase()
    .from("eventos")
    .insert(values)
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

/** Substitui todos os itens de um evento pelos informados. */
export async function replaceItens(
  eventoId: string,
  itens: { tipo: string; produto_id: string; quantidade: number }[],
): Promise<void> {
  const sb = getSupabase();
  const { error: delErr } = await sb
    .from("evento_itens")
    .delete()
    .eq("evento_id", eventoId);
  if (delErr) throw delErr;
  if (itens.length > 0) {
    const rows = itens.map((i) => ({ ...i, evento_id: eventoId }));
    const { error } = await sb.from("evento_itens").insert(rows);
    if (error) throw error;
  }
}
