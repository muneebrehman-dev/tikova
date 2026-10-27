"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Building2,
  Factory,
  Hotel,
  Store,
  Warehouse,
  Ticket,
  Stethoscope,
  Layers,
  Sparkles,
  Info,
  Lock,
  type LucideIcon,
} from "lucide-react";
import type { AssetType, DocStatus, FieldStatus, PersonaId, ScreenStatus, Stage } from "@/lib/types";
import { PERSONA } from "@/lib/data/personas";
import { STAGE_LABEL } from "@/lib/data/deals";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/* ------------------------------ Tones ---------------------------------- */

export type Tone = "pass" | "soft" | "fail" | "info" | "neutral" | "brand" | "ink";

const TONE: Record<Tone, string> = {
  pass: "bg-pass-soft text-pass ring-pass/20",
  soft: "bg-soft-soft text-soft ring-soft/25",
  fail: "bg-fail-soft text-fail ring-fail/20",
  info: "bg-info-soft text-info ring-info/20",
  neutral: "bg-muted text-muted-foreground ring-border",
  brand: "bg-brand-soft text-brand-strong ring-brand/30",
  ink: "bg-ink text-white ring-ink",
};

const DOT: Record<Tone, string> = {
  pass: "bg-pass",
  soft: "bg-soft",
  fail: "bg-fail",
  info: "bg-info",
  neutral: "bg-muted-foreground/50",
  brand: "bg-brand",
  ink: "bg-white",
};

export function Pill({
  tone = "neutral",
  children,
  dot,
  className,
  icon: Icon,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
  icon?: LucideIcon;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[11px] font-medium ring-1 ring-inset",
        TONE[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", DOT[tone])} />}
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  );
}

export const SCREEN_TONE: Record<ScreenStatus, Tone> = {
  pass: "pass",
  soft_miss: "soft",
  hard_fail: "fail",
  incomplete: "info",
};
const SCREEN_LABEL: Record<ScreenStatus, string> = {
  pass: "Pass",
  soft_miss: "Soft miss",
  hard_fail: "Hard fail",
  incomplete: "Incomplete",
};

export function ScreenPill({ status, className }: { status: ScreenStatus; className?: string }) {
  return (
    <Pill tone={SCREEN_TONE[status]} dot className={className}>
      {SCREEN_LABEL[status]}
    </Pill>
  );
}

const DOC_STATUS: Record<DocStatus, { tone: Tone; label: string }> = {
  missing: { tone: "fail", label: "Missing" },
  stored: { tone: "neutral", label: "Stored" },
  ready: { tone: "info", label: "Ready to extract" },
  processing: { tone: "brand", label: "Extracting…" },
  needs_review: { tone: "soft", label: "Needs review" },
  approved: { tone: "pass", label: "Approved" },
};

export function DocStatusPill({ status }: { status: DocStatus }) {
  const m = DOC_STATUS[status];
  return (
    <Pill tone={m.tone} dot>
      {m.label}
    </Pill>
  );
}

const FIELD_STATUS: Record<FieldStatus, { tone: Tone; label: string }> = {
  extracted: { tone: "info", label: "Extracted" },
  needs_review: { tone: "soft", label: "Needs review" },
  approved: { tone: "pass", label: "Approved" },
  rejected: { tone: "fail", label: "Rejected" },
};

export function FieldStatusPill({ status }: { status: FieldStatus }) {
  const m = FIELD_STATUS[status];
  return (
    <Pill tone={m.tone} dot>
      {m.label}
    </Pill>
  );
}

const STAGE_TONE: Record<Stage, Tone> = {
  intake: "neutral",
  screening: "info",
  underwriting: "brand",
  term_sheet: "soft",
  committee: "ink",
  approved: "pass",
  declined: "fail",
  dead: "neutral",
};

export function StagePill({ stage }: { stage: Stage }) {
  return (
    <Pill tone={STAGE_TONE[stage]} dot>
      {STAGE_LABEL[stage]}
    </Pill>
  );
}

/* ----------------------------- Layout bits ----------------------------- */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-[28px] font-semibold leading-tight text-ink md:text-[32px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  icon: Icon,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  icon?: LucideIcon;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b px-5 py-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="size-4 text-muted-foreground" />}
              <h3 className="font-display text-[15px] font-semibold text-ink">{title}</h3>
            </div>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "brand" | "pass" | "soft" | "fail";
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span
            className={cn(
              "grid size-7 place-items-center rounded-lg bg-muted text-muted-foreground",
              tone === "brand" && "bg-brand-soft text-brand-strong",
              tone === "pass" && "bg-pass-soft text-pass",
              tone === "soft" && "bg-soft-soft text-soft",
              tone === "fail" && "bg-fail-soft text-fail",
            )}
          >
            <Icon className="size-3.5" />
          </span>
        )}
      </div>
      <div className="mt-2 font-display text-[26px] font-semibold leading-none text-ink tnum">{value}</div>
      {sub && <div className="mt-2 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function KV({ k, v, className }: { k: React.ReactNode; v: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-1.5 text-sm", className)}>
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium text-ink tnum">{v}</span>
    </div>
  );
}

/* ------------------------------- People -------------------------------- */

export function PersonaAvatar({ id, size = 28, className }: { id: PersonaId | "system" | "claude"; size?: number; className?: string }) {
  if (id === "claude") {
    return (
      <span
        className={cn("grid shrink-0 place-items-center rounded-full bg-brand-soft text-brand-strong ring-1 ring-brand/30", className)}
        style={{ width: size, height: size }}
      >
        <Sparkles style={{ width: size * 0.5, height: size * 0.5 }} />
      </span>
    );
  }
  if (id === "system") {
    return (
      <span
        className={cn("grid shrink-0 place-items-center rounded-full bg-muted text-muted-foreground ring-1 ring-border", className)}
        style={{ width: size, height: size }}
      >
        <Layers style={{ width: size * 0.45, height: size * 0.45 }} />
      </span>
    );
  }
  const p = PERSONA[id];
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full font-semibold text-white", className)}
      style={{ width: size, height: size, background: p.color, fontSize: size * 0.36 }}
      title={p.title}
    >
      {p.initials}
    </span>
  );
}

export function actorName(id: PersonaId | "system" | "claude"): string {
  if (id === "claude") return "Claude (AI)";
  if (id === "system") return "System";
  return PERSONA[id].title;
}

/* -------------------------------- Brand -------------------------------- */

export function TikovaMark({ className, light }: { className?: string; light?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill={light ? "#fff" : "#0d0d0e"} />
      <path d="M8 9.5h16v3.2h-6.4V24h-3.2V12.7H8z" fill={light ? "#0d0d0e" : "#fff"} />
      <circle cx="22.4" cy="21.6" r="2.4" fill="#d9922e" />
    </svg>
  );
}

export function Wordmark({ className, light }: { className?: string; light?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <TikovaMark light={light} className="size-7" />
      <span
        className={cn("font-display text-[17px] font-semibold tracking-[0.16em]", light ? "text-white" : "text-ink")}
      >
        TIKOVA
      </span>
    </div>
  );
}

export function ClaudeChip({ children = "Claude", className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1 rounded-full bg-gradient-to-r from-brand-soft to-[#fdf7ee] px-2 text-[11px] font-medium text-brand-strong ring-1 ring-inset ring-brand/30",
        className,
      )}
    >
      <Sparkles className="size-3" />
      {children}
    </span>
  );
}

export function CodeChip({ children = "Deterministic code", className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1 rounded-full bg-ink px-2 font-mono text-[10.5px] font-medium text-white",
        className,
      )}
    >
      <Lock className="size-3" />
      {children}
    </span>
  );
}

export function PreviewBanner({ phase = "Phase 2+", children }: { phase?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-dashed border-brand/50 bg-brand-soft/60 px-4 py-3 text-sm">
      <span className="mt-0.5 rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
        {phase} preview
      </span>
      <p className="text-[13px] leading-relaxed text-ink/80">{children}</p>
    </div>
  );
}

export function InfoTip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className={cn("inline-grid text-muted-foreground hover:text-ink", className)}>
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">{children}</TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------ Assets --------------------------------- */

const ASSET_ICON: Record<AssetType, LucideIcon> = {
  Multifamily: Building2,
  Industrial: Factory,
  Retail: Store,
  "Mixed-Use": Layers,
  Hospitality: Hotel,
  "Self-Storage": Warehouse,
  Entertainment: Ticket,
  "Medical Office": Stethoscope,
};

export function AssetIcon({ type, className }: { type: AssetType; className?: string }) {
  const I = ASSET_ICON[type];
  return <I className={className} />;
}

export function AssetTile({ type, className }: { type: AssetType; className?: string }) {
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-white", className)}>
      <AssetIcon type={type} className="size-4" />
    </span>
  );
}

/* ------------------------------ Progress ------------------------------- */

export function Ring({ value, size = 32, stroke = 3.5, tone = "#0d0d0e", label }: { value: number; size?: number; stroke?: number; tone?: string; label?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#ebe8e1" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tone}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))}
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      {label && <span className="absolute text-[9px] font-semibold text-ink tnum">{label}</span>}
    </span>
  );
}

export function Bar({ value, tone = "bg-ink", className }: { value: number; tone?: string; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full transition-all duration-500", tone)} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

export function TextLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("font-medium text-ink underline decoration-border underline-offset-4 hover:decoration-ink", className)}>
      {children}
    </Link>
  );
}

export function Empty({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: React.ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center">
      <span className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <div className="mt-3 font-display text-base font-semibold text-ink">{title}</div>
      {children && <div className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
