import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Briefcase,
  CalendarDays,
  Contact,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

export type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Cor do ícone (classe Tailwind) quando o item não está selecionado. */
  color?: string;
};

export type MenuGroup = {
  label: string;
  items: MenuItem[];
};

/**
 * Configuração central dos menus do ERP.
 * Para adicionar um menu novo: inclua um item aqui e crie a rota
 * correspondente em `src/app/(erp)/<rota>/page.tsx`.
 */
export const menu: MenuGroup[] = [
  {
    label: "Geral",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-sky-500" },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { label: "Clientes", href: "/clientes", icon: Users, color: "text-violet-500" },
      { label: "Produtos", href: "/produtos", icon: Package, color: "text-amber-500" },
    ],
  },
  {
    label: "Operação",
    items: [
      { label: "Eventos", href: "/eventos", icon: CalendarDays, color: "text-rose-500" },
      { label: "Estoque", href: "/estoque", icon: Boxes, color: "text-emerald-500" },
    ],
  },
  {
    label: "Comercial",
    items: [{ label: "Comercial", href: "/comercial", icon: Briefcase, color: "text-indigo-500" }],
  },
  {
    label: "Freelancers",
    items: [{ label: "Freelancers", href: "/freelancers", icon: Contact, color: "text-fuchsia-500" }],
  },
  {
    label: "Financeiro",
    items: [
      { label: "Contas a Pagar", href: "/contas-pagar", icon: Wallet, color: "text-orange-500" },
      { label: "Faturamento", href: "/faturamento", icon: Receipt, color: "text-teal-500" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Configurações", href: "/configuracoes", icon: Settings, color: "text-slate-500" },
    ],
  },
];
