import { configTabs } from "./configuracoes";

export type SubAccess = { id: string; label: string };
export type MenuAccess = { href: string; label: string; subs?: SubAccess[] };

/** Árvore de menus e submenus para o controle de acesso (Acessos do usuário). */
export const ACCESS_TREE: MenuAccess[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    subs: [
      { id: "eventos", label: "Eventos" },
      { id: "estoque", label: "Estoque" },
      { id: "comercial", label: "Comercial" },
      { id: "freelancers", label: "Freelancers" },
      { id: "contas", label: "Contas a Pagar" },
      { id: "faturamento", label: "Faturamento" },
    ],
  },
  { href: "/clientes", label: "Clientes" },
  { href: "/produtos", label: "Produtos" },
  {
    href: "/eventos",
    label: "Eventos",
    subs: [
      { id: "eventos", label: "Eventos" },
      { id: "status", label: "Status" },
    ],
  },
  { href: "/estoque", label: "Estoque" },
  {
    href: "/comercial",
    label: "Comercial",
    subs: [
      { id: "pedidos", label: "Pedidos" },
      { id: "status", label: "Status Comercial" },
      { id: "vendedor", label: "Vendedor" },
      { id: "versao", label: "Versão" },
      { id: "agencia", label: "Agências" },
    ],
  },
  {
    href: "/freelancers",
    label: "Freelancers",
    subs: [
      { id: "servicos", label: "Serviços" },
      { id: "freelancers", label: "Freelancers" },
      { id: "categoria", label: "Categoria Freelancer" },
    ],
  },
  {
    href: "/contas-pagar",
    label: "Contas a Pagar",
    subs: [
      { id: "contas", label: "Contas a Pagar" },
      { id: "status", label: "Status Pagamento" },
    ],
  },
  {
    href: "/faturamento",
    label: "Faturamento",
    subs: [
      { id: "faturamento", label: "Faturamento" },
      { id: "status", label: "Status Recebimento" },
      { id: "taxa", label: "Taxa de Impostos" },
      { id: "tipo", label: "Tipo de Lançamento" },
    ],
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    subs: configTabs.map((t) => ({ id: t.id, label: t.label })),
  },
];

type PermUser = { is_admin?: boolean; permissoes?: string[] } | null | undefined;

export function subKey(href: string, subId: string): string {
  return `${href}#${subId}`;
}

export function canMenu(user: PermUser, href: string): boolean {
  if (!user) return false;
  if (user.is_admin) return true;
  return (user.permissoes ?? []).includes(href);
}

export function canSub(user: PermUser, href: string, subId: string): boolean {
  if (!user) return false;
  if (user.is_admin) return true;
  return (user.permissoes ?? []).includes(subKey(href, subId));
}

/** Filtra abas (com .id) pelas permissões do usuário. */
export function allowedSubs<T extends { id: string }>(
  user: PermUser,
  href: string,
  tabs: readonly T[],
): T[] {
  if (user?.is_admin) return [...tabs];
  return tabs.filter((t) => canSub(user, href, t.id));
}
