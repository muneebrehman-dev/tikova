import {
  LayoutDashboard,
  KanbanSquare,
  ScanText,
  Gavel,
  Landmark,
  Users,
  Briefcase,
  HardHat,
  GitFork,
  Sparkles,
  ShieldCheck,
  Plug,
  Settings,
  Map,
  Receipt,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  locked?: boolean;
  badgeKey?: "pipeline" | "review" | "committee";
}

export interface NavSection {
  label: string;
  note?: string;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/pipeline", label: "Deal Pipeline", icon: KanbanSquare, badgeKey: "pipeline" },
      { href: "/review", label: "AI Review Queue", icon: ScanText, badgeKey: "review" },
      { href: "/committee", label: "Credit Committee", icon: Gavel, badgeKey: "committee" },
    ],
  },
  {
    label: "Relationships",
    items: [
      { href: "/capital-partners", label: "Capital Partners", icon: Landmark },
      { href: "/relationships", label: "Sponsors & Brokers", icon: Users },
    ],
  },
  {
    label: "Loan Lifecycle",
    note: "Phase 2+ preview",
    items: [
      { href: "/portfolio", label: "Portfolio", icon: Briefcase },
      { href: "/draws", label: "Construction Draws", icon: HardHat },
      { href: "/waterfall", label: "Participations & Waterfall", icon: GitFork },
      { href: "#", label: "Servicing & Accounting", icon: Receipt, locked: true },
      { href: "#", label: "Investor Reporting", icon: BarChart3, locked: true },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/ai", label: "How the AI Works", icon: Sparkles },
      { href: "/audit", label: "Audit Trail", icon: ShieldCheck },
      { href: "/integrations", label: "Integrations", icon: Plug },
      { href: "/admin", label: "Users & Roles", icon: Settings },
      { href: "/roadmap", label: "Lifecycle & Roadmap", icon: Map },
    ],
  },
];
