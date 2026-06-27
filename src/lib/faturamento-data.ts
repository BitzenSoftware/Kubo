import { getSupabase } from "./supabase";

export type Faturamento = {
  id: string;
  cliente_id: string | null;
  evento_id: string | null;
  valor_bruto: number | null;
  empresa_id: string | null;
  taxa_id: string | null;
  nota_fiscal: string | null;
  data_emissao: string | null;
  vencimento: string | null;
  status_recebimento_id: string | null;
  data_recebimento: string | null;
  tipo_id: string | null;
  ativo: boolean;
  evento: { id_evento: string; nome: string } | null;
  cliente: { nome: string } | null;
  empresa: { nome: string } | null;
  taxa: { nome: string; percentual: number } | null;
  status: { nome: string } | null;
  tipo: { nome: string } | null;
};

/** Garante que exista um Status Recebimento com este nome e devolve o id. */
export async function ensureStatusRecebimento(nome: string): Promise<string> {
  const sb = getSupabase();
  const { data: found, error: e1 } = await sb
    .from("status_recebimento")
    .select("id")
    .ilike("nome", nome)
    .limit(1)
    .maybeSingle();
  if (e1) throw e1;
  if (found?.id) return found.id as string;
  const { data, error } = await sb
    .from("status_recebimento")
    .insert({ nome })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

/** Cria um Faturamento a partir de um pedido Comercial (campos correspondentes). */
export async function criarFaturamentoDeComercial(c: {
  evento_id: string | null;
  cliente_id: string | null;
  valor_orcado: number | null;
  empresa_id: string | null;
}): Promise<void> {
  const statusId = await ensureStatusRecebimento("Pendente");
  const { error } = await getSupabase().from("faturamento").insert({
    evento_id: c.evento_id,
    cliente_id: c.cliente_id,
    valor_bruto: c.valor_orcado,
    empresa_id: c.empresa_id,
    status_recebimento_id: statusId,
  });
  if (error) throw error;
}

export async function listFaturamento(): Promise<Faturamento[]> {
  const { data, error } = await getSupabase()
    .from("faturamento")
    .select(
      "id, cliente_id, evento_id, valor_bruto, empresa_id, taxa_id, nota_fiscal, data_emissao, vencimento, status_recebimento_id, data_recebimento, tipo_id, ativo, evento:evento_id(id_evento, nome), cliente:cliente_id(nome), empresa:empresa_id(nome), taxa:taxa_id(nome, percentual), status:status_recebimento_id(nome), tipo:tipo_id(nome)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Faturamento[];
}

/**
 * Custo do Evento por evento = soma do Valor Total das Contas a Pagar
 * + soma do Valor dos serviços de Freelancers, ambos do mesmo evento.
 */
export async function listCustoPorEvento(): Promise<Record<string, number>> {
  const sb = getSupabase();
  const [contasRes, freelaRes] = await Promise.all([
    sb.from("contas_pagar").select("evento_id, valor_total"),
    sb.from("freelancer_servico").select("evento_id, valor"),
  ]);
  if (contasRes.error) throw contasRes.error;
  if (freelaRes.error) throw freelaRes.error;

  const map: Record<string, number> = {};
  for (const r of (contasRes.data ?? []) as {
    evento_id: string | null;
    valor_total: number | null;
  }[]) {
    if (!r.evento_id) continue;
    map[r.evento_id] = (map[r.evento_id] ?? 0) + (r.valor_total ?? 0);
  }
  for (const r of (freelaRes.data ?? []) as {
    evento_id: string | null;
    valor: number | null;
  }[]) {
    if (!r.evento_id) continue;
    map[r.evento_id] = (map[r.evento_id] ?? 0) + (r.valor ?? 0);
  }
  return map;
}
