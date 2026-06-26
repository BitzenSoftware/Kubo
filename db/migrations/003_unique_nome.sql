-- =====================================================================
-- Kubo ERP — Migração 003: impede nomes duplicados nas Configurações
-- Índice único case-insensitive em nome (lower(nome)) em cada uma das 10
-- tabelas. É a garantia real contra duplicados (inclusive na importação).
-- Obs: se já existirem duplicados numa tabela, a criação do índice falha
-- nessa tabela — limpe os duplicados antes de rodar de novo.
-- =====================================================================
do $$
declare
  t text;
  tabelas text[] := array[
    'bancos','formas_pagamento','grupo_plano','categoria_freelancer',
    'tipo_lancamento','status_comercial','origem_plano_contas',
    'freelancers','empresa','plano_contas'
  ];
begin
  foreach t in array tabelas loop
    execute format(
      'create unique index if not exists %I on public.%I (lower(nome));',
      t || '_nome_uniq', t
    );
  end loop;
end $$;
