import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  Table2,
  LineChart,
  BarChart3,
  Workflow,
  Landmark,
  CalendarClock,
  UserCircle,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type Role = "admin" | "user" | "viewer";

export interface NavItem {
  /** Código da página no PRD (P02–P12). */
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  /** Páginas ainda não implementadas aparecem desabilitadas com badge "Em breve". */
  comingSoon?: boolean;
}

/**
 * Config única das 11 páginas protegidas (P02–P12 — PRD §2.3).
 * "Dashboard" e "Transações" apontam pra rotas reais (Fase 2); as demais
 * ganham o link quando a respectiva Fase for implementada.
 *
 * "Painel n8n" e "Configurações de Sistema" são exclusivas de admin
 * (PRD §2.1 — usuário/visualizador não têm acesso a configurações críticas).
 */
export const NAV_ITEMS: NavItem[] = [
  {
    id: "P02",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "user", "viewer"],
  },
  {
    id: "P03",
    label: "Transações",
    href: "/transacoes",
    icon: ArrowLeftRight,
    roles: ["admin", "user", "viewer"],
  },
  {
    id: "P04",
    label: "Categorias e Metas",
    href: "/categorias",
    icon: Target,
    roles: ["admin", "user", "viewer"],
  },
  {
    id: "P05",
    label: "Planejamento Mensal",
    href: "/planejamento",
    icon: Table2,
    roles: ["admin", "user", "viewer"],
  },
  {
    id: "P06",
    label: "Investimentos",
    href: "/investimentos",
    icon: LineChart,
    roles: ["admin", "user", "viewer"],
  },
  {
    id: "P07",
    label: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
    roles: ["admin", "user", "viewer"],
  },
  {
    id: "P08",
    label: "Painel n8n",
    href: "/n8n",
    icon: Workflow,
    roles: ["admin"],
  },
  {
    id: "P09",
    label: "Contas Bancárias",
    href: "/contas",
    icon: Landmark,
    roles: ["admin", "user", "viewer"],
  },
  {
    id: "P10",
    label: "Calendário de Contas",
    href: "/calendario",
    icon: CalendarClock,
    roles: ["admin", "user", "viewer"],
  },
  {
    id: "P11",
    label: "Perfil",
    href: "/perfil",
    icon: UserCircle,
    roles: ["admin", "user", "viewer"],
  },
  {
    id: "P12",
    label: "Configurações de Sistema",
    href: "/configuracoes",
    icon: Settings,
    roles: ["admin"],
  },
];

/** Itens mais usados para a bottom bar mobile (PRD §4.4). */
export const MOBILE_NAV_IDS = ["P02", "P03", "P04", "P07"];

/** Filtra os itens de navegação visíveis para um determinado papel. */
export function getNavItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
