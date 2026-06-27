import { getSupabase } from "./supabase";

export type ContaPagar = {
  id: string;
  data_vencimento: string | null;
  evento_id: string | null;
  plano_contas_id: string | null;
  empresa_id: string | null;
  fornecedor: string | null;
  descricao: string | null;
  valor_total: number | null;
  status_pagamento_id: string | null;
  data_pagamento: string | null;
  ativo: boolean;
  evento: { id_evento: string; nome: string } | null;
  categoria: { nome: string; grupo: { nome: string } | null } | null;
  empresa: { nome: string } | null;
  status: { nome: string } | null;
};

export type PlanoContaOpt = {
  id: string;
  nome: string;
  grupo_nome: string | null;
};

export async function listContas(): Promise<ContaPagar[]> {
  const { data, error } = await getSupabase()
    .from("contas_pagar")
    .select(
      "id, data_vencimento, evento_id, plano_contas_id, empresa_id, fornecedor, descricao, valor_total, status_pagamento_id, data_pagamento, ativo, evento:evento_id(id_evento, nome), categoria:plano_contas_id(nome, grupo:grupo_id(nome)), empresa:empresa_id(nome), status:status_pagamento_id(nome)",
    )
    .order("data_vencimento", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as ContaPagar[];
}

/** Plano de Contas (a "Categoria") já com o nome do grupo. */
export async function listPlanoContas(): Promise<PlanoContaOpt[]> {
  const { data, error } = await getSupabase()
    .from("plano_contas")
    .select("id, nome, grupo:grupo_id(nome)")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (
    (data ?? []) as unknown as {
      id: string;
      nome: string;
      grupo: { nome: string } | null;
    }[]
  ).map((p) => ({ id: p.id, nome: p.nome, grupo_nome: p.grupo?.nome ?? null }));
}
