export type FieldType = "text" | "date" | "select";

export type ConfigField = {
  key: string;
  label: string;
  type: FieldType;
  /** Para type "select": id da aba de onde vêm as opções (value = id, label = nome). */
  optionsFrom?: string;
  placeholder?: string;
};

export type ConfigTab = {
  id: string;
  /** Nome da tabela no banco (schema public). */
  table: string;
  /** Rótulo da aba (plural). */
  label: string;
  /** Rótulo no singular, usado em "Adicionar X" e título do modal. */
  singular: string;
  fields: ConfigField[];
};

/**
 * Definição das abas do menu Configurações.
 * A tela inteira (abas, tabelas e formulários) é gerada a partir daqui,
 * e o nome da tabela (`table`) liga cada aba ao banco (Supabase).
 */
export const configTabs: ConfigTab[] = [
  {
    id: "bancos",
    table: "bancos",
    label: "Bancos",
    singular: "Banco",
    fields: [{ key: "nome", label: "Nome", type: "text" }],
  },
  {
    id: "formas-pagamento",
    table: "formas_pagamento",
    label: "Formas de Pagamento",
    singular: "Forma de Pagamento",
    fields: [{ key: "nome", label: "Nome", type: "text" }],
  },
  {
    id: "freelancers",
    table: "freelancers",
    label: "Freelancers",
    singular: "Freelancer",
    fields: [
      { key: "nome", label: "Nome", type: "text" },
      { key: "cpf", label: "CPF", type: "text", placeholder: "000.000.000-00" },
      { key: "rg", label: "RG", type: "text" },
      { key: "nascimento", label: "Data de Nascimento", type: "date" },
    ],
  },
  {
    id: "plano-contas",
    table: "plano_contas",
    label: "Plano de Contas",
    singular: "Plano de Contas",
    fields: [
      { key: "nome", label: "Nome", type: "text" },
      {
        key: "grupo_id",
        label: "Grupo",
        type: "select",
        optionsFrom: "grupo-plano",
      },
    ],
  },
  {
    id: "grupo-plano",
    table: "grupo_plano",
    label: "Grupo do Plano",
    singular: "Grupo do Plano",
    fields: [{ key: "nome", label: "Nome", type: "text" }],
  },
  {
    id: "categoria-freelancer",
    table: "categoria_freelancer",
    label: "Categoria Freelancer",
    singular: "Categoria",
    fields: [{ key: "nome", label: "Nome", type: "text" }],
  },
  {
    id: "tipo-lancamento",
    table: "tipo_lancamento",
    label: "Tipo de Lançamento",
    singular: "Tipo de Lançamento",
    fields: [{ key: "nome", label: "Nome", type: "text" }],
  },
  {
    id: "status-comercial",
    table: "status_comercial",
    label: "Status Comercial",
    singular: "Status Comercial",
    fields: [{ key: "nome", label: "Nome", type: "text" }],
  },
  {
    id: "origem-plano-contas",
    table: "origem_plano_contas",
    label: "Origem Plano de Contas",
    singular: "Origem",
    fields: [{ key: "nome", label: "Nome", type: "text" }],
  },
  {
    id: "empresa",
    table: "empresa",
    label: "Empresa",
    singular: "Empresa",
    fields: [
      { key: "nome", label: "Nome", type: "text" },
      { key: "cnpj", label: "CNPJ", type: "text", placeholder: "00.000.000/0000-00" },
    ],
  },
];

export const configTabById = Object.fromEntries(
  configTabs.map((t) => [t.id, t]),
) as Record<string, ConfigTab>;
