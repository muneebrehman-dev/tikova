"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, FileSearch, MapPin, Star } from "lucide-react";
import { useApp, useDeal } from "@/lib/store";
import { STAGE_LABEL, TRANSITIONS } from "@/lib/data/deals";
import { SPONSOR } from "@/lib/data/relationships";
import { dealMetrics } from "@/lib/engine/sizing";
import { useScreening } from "@/lib/hooks";
import { money, pct, times } from "@/lib/format";
import type { Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AssetTile, Empty, Pill, StagePill } from "@/components/common/ui";
import { StageDialog, checkTransition } from "@/components/deals/stage-dialog";

const TABS = [
  { seg: "", label: "Overview" },
  { seg: "documents", label: "Documents" },
  { seg: "screening", label: "Screening" },
  { seg: "sizing", label: "Sizing" },
  { seg: "memo", label: "Credit Memo" },
  { seg: "committee", label: "Committee" },
  { seg: "term-sheet", label: "Term Sheet" },
  { seg: "activity", label: "Activity" },
];

export default function DealLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const deal = useDeal(id);
  const persona = useApp((s) => s.persona);
  const documents = useApp((s) => s.documents);
  const screening = useScreening(deal);
  const [pendingTo, setPendingTo] = React.useState<Stage | null>(null);

  if (!deal) {
    return (
      <Empty icon={FileSearch} title="Deal not found">
        This deal may have been created in another session. <Link className="underline" href="/pipeline">Back to pipeline</Link>
      </Empty>
    );
  }

  const m = dealMetrics(deal);
  const sponsor = SPONSOR[deal.sponsorId];
  const base = `/deals/${deal.id}`;
  const sub = pathname.slice(base.length).split("/")[1] ?? "";
  const isReview = pathname.includes("/documents/");
  const reviewCount = documents
    .filter((d) => d.dealId === deal.id)
    .reduce((a, d) => a + (d.status === "needs_review" ? d.fields.filter((f) => f.status !== "approved" && f.status !== "rejected").length : 0), 0);
  const fits = screening.filter((r) => r.status === "pass").length;

  const stats = [
    { k: "Request", v: money(deal.loanAmount) },
    { k: "LTC", v: pct(m.ltc) },
    { k: "LTV (stab.)", v: pct(m.ltv) },
    { k: "DSCR", v: times(m.dscr) },
    { k: "Debt yield", v: pct(m.debtYield, 2) },
    { k: "Partner fit", v: `${fits} of 4` },
  ];

  return (
    <div className="space-y-5">
      <div className={cn("no-print rounded-3xl border bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] md:p-6", isReview && "py-4 md:py-4")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <AssetTile type={deal.assetType} className={cn("size-12 rounded-2xl", isReview && "size-10")} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{deal.code}</span>
                <span>·</span>
                <span>{deal.productType}</span>
                {deal.id === "harborview" && (
                  <Pill tone="brand" icon={Star}>
                    Guided demo deal
                  </Pill>
                )}
              </div>
              <h1 className={cn("mt-1 font-display font-semibold leading-tight text-ink", isReview ? "text-2xl" : "text-[28px] md:text-[32px]")}>
                {deal.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {deal.address}, {deal.city}, {deal.state}
                </span>
                <span>Sponsor: <span className="font-medium text-ink">{sponsor?.name}</span></span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StagePill stage={deal.stage} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg">
                  Move stage <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Allowed from {STAGE_LABEL[deal.stage]}</DropdownMenuLabel>
                {TRANSITIONS[deal.stage].map((to) => (
                  <DropdownMenuItem
                    key={to}
                    onSelect={() => {
                      const err = checkTransition(deal, to, persona);
                      if (err) toast.error("Move blocked", { description: err });
                      else setPendingTo(to);
                    }}
                  >
                    → {STAGE_LABEL[to]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {!isReview && (
          <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-6">
            {stats.map((s) => (
              <div key={s.k} className="bg-card px-4 py-3">
                <div className="text-[11px] text-muted-foreground">{s.k}</div>
                <div className="mt-0.5 font-display text-lg font-semibold text-ink tnum">{s.v}</div>
              </div>
            ))}
          </div>
        )}

        <nav className="scrollbar-none -mb-5 mt-4 flex gap-1 overflow-x-auto border-t pt-1 md:-mb-6">
          {TABS.map((t) => {
            const active = t.seg === sub;
            return (
              <Link
                key={t.seg}
                href={t.seg ? `${base}/${t.seg}` : base}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 px-3 py-3 text-[13px] font-medium transition",
                  active ? "text-ink" : "text-muted-foreground hover:text-ink",
                )}
              >
                {t.label}
                {t.seg === "documents" && reviewCount > 0 && (
                  <span className="rounded-full bg-brand px-1.5 text-[10.5px] font-bold text-ink">{reviewCount}</span>
                )}
                {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-ink" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div>{children}</div>

      <StageDialog deal={pendingTo ? deal : null} to={pendingTo} onClose={() => setPendingTo(null)} />
    </div>
  );
}
