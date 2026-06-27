import { getSupabase } from "./supabase";

export type FreelancerServico = {
  id: string;
  cliente_id: string | null;
  evento_id: string | null;
  freelancer_id: string | null;
  descricao_servico: string | null;
  data_evento_inicio: string | null;
  data_evento_fim: string | null;
  valor: number | null;
  data_vencimento: string | null;
  categoria_id: string | null;
  status_pagamento_id: string | null;
  data_pagamento: string | null;
  ativo: boolean;
  evento: { id_evento: string; nome: string } | null;
  cliente: { nome: string } | null;
  freelancer: { nome: string } | null;
  categoria: { nome: string; grupo: { nome: string } | null } | null;
  status: { nome: string } | null;
};

export type CategoriaFreelancerOpt = {
  id: string;
  nome: string;
  grupo_nome: string | null;
};

export async function listFreelancerServicos(): Promise<FreelancerServico[]> {
  const { data, error } = await getSupabase()
    .from("freelancer_servico")
    .select(
      "id, cliente_id, evento_id, freelancer_id, descricao_servico, data_evento_inicio, data_evento_fim, valor, data_vencimento, categoria_id, status_pagamento_id, data_pagamento, ativo, evento:evento_id(id_evento, nome), cliente:cliente_id(nome), freelancer:freelancer_id(nome), categoria:categoria_id(nome, grupo:grupo_id(nome)), status:status_pagamento_id(nome)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as FreelancerServico[];
}

/** Categorias de freelancer já com o nome do grupo (para o Plano de Contas automático). */
export async function listCategoriasFreelancer(): Promise<CategoriaFreelancerOpt[]> {
  const { data, error } = await getSupabase()
    .from("categoria_freelancer")
    .select("id, nome, grupo:grupo_id(nome)")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (
    (data ?? []) as unknown as {
      id: string;
      nome: string;
      grupo: { nome: string } | null;
    }[]
  ).map((c) => ({ id: c.id, nome: c.nome, grupo_nome: c.grupo?.nome ?? null }));
}
