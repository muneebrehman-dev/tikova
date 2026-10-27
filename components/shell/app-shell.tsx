"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronsUpDown,
  Command as CommandIcon,
  Lock,
  LogOut,
  Menu,
  RotateCcw,
  Search,
  Check,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NAV } from "./nav";
import { useApp } from "@/lib/store";
import { PERSONA, PERSONAS } from "@/lib/data/personas";
import { PARTNERS } from "@/lib/data/partners";
import { STAGE_LABEL } from "@/lib/data/deals";
import { PersonaAvatar, Wordmark } from "@/components/common/ui";
import { relative } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/* ------------------------------ Sidebar -------------------------------- */

function useBadges() {
  const deals = useApp((s) => s.deals);
  const documents = useApp((s) => s.documents);
  return {
    pipeline: deals.filter((d) => !["declined", "dead", "approved"].includes(d.stage)).length,
    review: documents.filter((d) => d.status === "needs_review" || d.status === "ready").length,
    committee: deals.filter((d) => d.stage === "committee").length,
  };
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const badges = useBadges();
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-5">
        <Link href="/dashboard" onClick={onNavigate}>
          <Wordmark light />
        </Link>
      </div>
      <nav className="scrollbar-none flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((section) => (
          <div key={section.label} className="mt-4 first:mt-1">
            <div className="flex items-center justify-between px-2.5 pb-1.5">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                {section.label}
              </span>
              {section.note && (
                <span className="rounded bg-brand/15 px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wide text-brand">
                  {section.note}
                </span>
              )}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.href !== "#" && (pathname === item.href || pathname.startsWith(item.href + "/"));
                const badge = item.badgeKey ? badges[item.badgeKey] : undefined;
                if (item.locked) {
                  return (
                    <li key={item.label}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex cursor-not-allowed items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] text-zinc-600">
                            <item.icon className="size-4" />
                            <span className="flex-1">{item.label}</span>
                            <Lock className="size-3" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right">Designed in the data model; built in a later phase.</TooltipContent>
                      </Tooltip>
                    </li>
                  );
                }
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
                        active ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/60 hover:text-zinc-100",
                      )}
                    >
                      {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-brand" />}
                      <item.icon className={cn("size-4", active ? "text-brand" : "text-zinc-500 group-hover:text-zinc-300")} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {badge ? (
                        <span
                          className={cn(
                            "min-w-5 rounded-full px-1.5 text-center text-[10.5px] font-semibold tnum",
                            item.badgeKey === "review" ? "bg-brand text-ink" : "bg-zinc-800 text-zinc-300",
                          )}
                        >
                          {badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="m-3 rounded-xl border border-sidebar-border bg-gradient-to-br from-[#17171a] to-[#0f0f11] p-3">
        <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-300">
          <Sparkles className="size-3.5 text-brand" />
          Claude reads · code calculates · people approve
        </div>
        <div className="mt-1.5 text-[10.5px] leading-relaxed text-zinc-500">
          Interactive prototype. All deals, sponsors and partners are fictional demo data.
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Topbar --------------------------------- */

function useCrumbs() {
  const pathname = usePathname();
  const deals = useApp((s) => s.deals);
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  const LABELS: Record<string, string> = {
    dashboard: "Dashboard",
    pipeline: "Deal Pipeline",
    deals: "Deals",
    review: "AI Review Queue",
    committee: "Credit Committee",
    "capital-partners": "Capital Partners",
    relationships: "Sponsors & Brokers",
    portfolio: "Portfolio",
    draws: "Construction Draws",
    waterfall: "Participations & Waterfall",
    ai: "How the AI Works",
    audit: "Audit Trail",
    integrations: "Integrations",
    admin: "Users & Roles",
    roadmap: "Lifecycle & Roadmap",
    documents: "Documents",
    screening: "Screening",
    sizing: "Sizing",
    memo: "Credit Memo",
    "term-sheet": "Term Sheet",
    activity: "Activity",
    new: "New Deal",
  };
  let href = "";
  parts.forEach((p, i) => {
    href += `/${p}`;
    if (p === "deals" && i === 0) {
      crumbs.push({ label: "Deal Pipeline", href: "/pipeline" });
      return;
    }
    const deal = parts[i - 1] === "deals" ? deals.find((d) => d.id === p) : undefined;
    const partner = parts[i - 1] === "capital-partners" ? PARTNERS.find((x) => x.id === p) : undefined;
    const label = deal?.name ?? partner?.name ?? LABELS[p] ?? (parts[i - 1] === "documents" ? "Extraction Review" : p);
    crumbs.push({ label, href });
  });
  return crumbs;
}

function PersonaMenu() {
  const persona = useApp((s) => s.persona);
  const setPersona = useApp((s) => s.setPersona);
  const reset = useApp((s) => s.reset);
  const router = useRouter();
  const p = PERSONA[persona];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 rounded-xl border bg-card py-1 pl-1 pr-2.5 text-left shadow-sm transition hover:bg-muted">
          <PersonaAvatar id={persona} size={30} />
          <span className="hidden leading-tight sm:block">
            <span className="block text-[12.5px] font-semibold text-ink">{p.title}</span>
            <span className="block text-[10.5px] text-muted-foreground">{p.group}</span>
          </span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          View the platform as… <span className="font-normal">(role-based access)</span>
        </DropdownMenuLabel>
        {PERSONAS.map((x) => (
          <DropdownMenuItem
            key={x.id}
            onSelect={() => {
              setPersona(x.id);
              toast.success(`Now viewing as ${x.title}`, { description: x.blurb });
            }}
            className="gap-2.5 py-1.5"
          >
            <PersonaAvatar id={x.id} size={24} />
            <span className="flex-1">
              <span className="block text-[13px] font-medium">{x.title}</span>
              <span className="block text-[11px] text-muted-foreground">{x.group}</span>
            </span>
            {x.id === persona && <Check className="size-4 text-brand" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            reset();
            toast("Demo data reset", { description: "All deals, reviews and votes restored to the starting state." });
          }}
        >
          <RotateCcw className="size-4" /> Reset demo data
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/")}>
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Notifications() {
  const audit = useApp((s) => s.audit);
  const read = useApp((s) => s.readNotifications);
  const mark = useApp((s) => s.markNotificationsRead);
  const items = React.useMemo(
    () =>
      [
        { id: "nt-1", href: "/deals/harborview/documents/hv-appraisal", title: "Appraisal extracted — 6 fields need review", sub: "Harborview Lofts · 1 cross-document flag", at: "2026-10-24T17:53:12.000Z", ai: true },
        { id: "nt-2", href: "/deals/harborview/documents/hv-pfs", title: "Sponsor PFS uploaded (scanned) — ready to extract", sub: "SSN redacted before model call", at: "2026-10-26T15:05:04.000Z", ai: true },
        { id: "nt-3", href: "/committee", title: "Arlington Yards awaiting your committee vote", sub: "Partner voted: approve with conditions", at: "2026-10-24T14:10:00.000Z" },
        { id: "nt-4", href: "/capital-partners/fund1", title: "Fund I buy-box v3 in effect", sub: "Max LTV 72.5% → 75.0%", at: "2026-10-01T13:05:00.000Z" },
        ...audit
          .slice(-30)
          .filter((e) => e.at > "2026-10-27T15:00:00.000Z")
          .slice(-3)
          .reverse()
          .map((e) => ({ id: e.id, href: "/audit", title: `${e.entityLabel}: ${e.action.replace(".", " ").replace("_", " ")}`, sub: e.after ?? "", at: e.at, ai: e.actor === "claude" })),
      ].sort((a, b) => (a.at < b.at ? 1 : -1)),
    [audit],
  );
  const unread = items.filter((i) => !read.includes(i.id)).length;
  return (
    <Popover onOpenChange={(o) => !o && mark(items.map((i) => i.id))}>
      <PopoverTrigger asChild>
        <button className="relative grid size-9 place-items-center rounded-xl border bg-card shadow-sm transition hover:bg-muted" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid min-w-4.5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-ink">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-display text-sm font-semibold">Notifications</span>
          <span className="text-xs text-muted-foreground">{unread} unread</span>
        </div>
        <ul className="max-h-96 divide-y overflow-y-auto">
          {items.map((i) => (
            <li key={i.id}>
              <Link href={i.href} className="flex gap-3 px-4 py-3 transition hover:bg-muted/60">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", read.includes(i.id) ? "bg-transparent" : "bg-brand")} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                    {i.ai && <Sparkles className="size-3.5 text-brand" />}
                    {i.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{i.sub}</span>
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{relative(i.at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function CommandMenu({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const router = useRouter();
  const deals = useApp((s) => s.deals);
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);
  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Search Tikova" description="Search deals, partners and pages">
      <CommandInput placeholder="Search deals, partners, pages…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Deals">
          {deals.map((d) => (
            <CommandItem key={d.id} value={`${d.name} ${d.code} ${d.city}`} onSelect={() => go(`/deals/${d.id}`)}>
              <span className="font-mono text-[11px] text-muted-foreground">{d.code}</span>
              <span className="flex-1">{d.name}</span>
              <span className="text-xs text-muted-foreground">{STAGE_LABEL[d.stage]}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Capital partners">
          {PARTNERS.map((p) => (
            <CommandItem key={p.id} value={`${p.name} ${p.type}`} onSelect={() => go(`/capital-partners/${p.id}`)}>
              <span className="flex-1">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.type}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Pages">
          {NAV.flatMap((s) => s.items)
            .filter((i) => !i.locked)
            .map((i) => (
              <CommandItem key={i.href} value={i.label} onSelect={() => go(i.href)}>
                <i.icon className="size-4" />
                <span className="flex-1">{i.label}</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const crumbs = useCrumbs();
  const [open, setOpen] = React.useState(false);
  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-xl md:px-6">
      <button className="grid size-9 place-items-center rounded-xl border bg-card lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="size-4" />
      </button>
      <nav className="hidden min-w-0 flex-1 items-center gap-1.5 text-[13px] md:flex">
        {crumbs.map((c, i) => (
          <React.Fragment key={c.href}>
            {i > 0 && <span className="text-muted-foreground/50">/</span>}
            {i === crumbs.length - 1 ? (
              <span className="truncate font-medium text-ink">{c.label}</span>
            ) : (
              <Link href={c.href} className="truncate text-muted-foreground hover:text-ink">
                {c.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>
      <div className="flex-1 md:hidden" />
      <button
        onClick={() => setOpen(true)}
        className="hidden h-9 w-64 items-center gap-2 rounded-xl border bg-card px-3 text-[13px] text-muted-foreground shadow-sm transition hover:bg-muted sm:flex"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search deals, partners…</span>
        <kbd className="flex items-center gap-0.5 rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
          <CommandIcon className="size-2.5" />K
        </kbd>
      </button>
      <span className="hidden items-center gap-1.5 rounded-full border border-brand/40 bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand-strong xl:flex">
        <span className="size-1.5 animate-pulse rounded-full bg-brand" />
        Prototype · demo data
      </span>
      <Notifications />
      <PersonaMenu />
      <CommandMenu open={open} setOpen={setOpen} />
    </header>
  );
}

/* ------------------------------- Shell --------------------------------- */

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  return (
    <div className="min-h-dvh bg-background">
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-[260px] lg:block">
        <SidebarBody />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[270px] border-0 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="lg:pl-[260px]">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

/** Small helper: a persona-aware guard for actions. */
export function usePersona() {
  return useApp((s) => s.persona);
}
