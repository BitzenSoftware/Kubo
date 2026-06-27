import { getSupabase } from "./supabase";

export type Comercial = {
  id: string;
  data_pedido: string | null;
  status_comercial_id: string | null;
  cliente_id: string | null;
  evento_id: string | null;
  agencia_id: string | null;
  responsavel: string | null;
  local: string | null;
  data_evento_inicio: string | null;
  data_evento_fim: string | null;
  vendedor_id: string | null;
  valor_orcado: number | null;
  versao_id: string | null;
  empresa_id: string | null;
  ativo: boolean;
  evento: { id_evento: string; nome: string } | null;
  status: { nome: string } | null;
  cliente: { nome: string } | null;
  vendedor: { nome: string } | null;
  versao: { nome: string } | null;
  empresa: { nome: string } | null;
  agencia: { nome: string } | null;
};

export async function listComercial(): Promise<Comercial[]> {
  const { data, error } = await getSupabase()
    .from("comercial")
    .select(
      "id, data_pedido, status_comercial_id, cliente_id, evento_id, agencia_id, responsavel, local, data_evento_inicio, data_evento_fim, vendedor_id, valor_orcado, versao_id, empresa_id, ativo, evento:evento_id(id_evento, nome), status:status_comercial_id(nome), cliente:cliente_id(nome), vendedor:vendedor_id(nome), versao:versao_id(nome), empresa:empresa_id(nome), agencia:agencia_id(nome)",
    )
    .order("data_pedido", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Comercial[];
}
