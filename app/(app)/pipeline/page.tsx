"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { ArrowUpDown, Columns3, LayoutList, Plus, Search, Star, Flag, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { STAGE_LABEL } from "@/lib/data/deals";
import { SPONSOR } from "@/lib/data/relationships";
import { PARTNERS } from "@/lib/data/partners";
import { dealMetrics } from "@/lib/engine/sizing";
import { screenDeal, useCan } from "@/lib/hooks";
import { daysAgo, moneyShort, money, pct, times } from "@/lib/format";
import type { AssetType, Deal, Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AssetTile,
  PageHeader,
  PersonaAvatar,
  Pill,
  Ring,
  SCREEN_TONE,
  StagePill,
} from "@/components/common/ui";
import { StageDialog, checkTransition } from "@/components/deals/stage-dialog";

const BOARD: Stage[] = ["intake", "screening", "underwriting", "term_sheet", "committee", "approved"];

function FitDots({ deal }: { deal: Deal }) {
  const res = screenDeal(deal);
  return (
    <span className="flex items-center gap-1" title="Buy-box fit: Fund I · Meridian · Atlas · Bayline">
      {res.map((r) => (
        <span
          key={r.partnerId}
          className={cn(
            "size-2 rounded-full",
            SCREEN_TONE[r.status] === "pass" && "bg-pass",
            SCREEN_TONE[r.status] === "soft" && "bg-soft",
            SCREEN_TONE[r.status] === "info" && "bg-info",
            SCREEN_TONE[r.status] === "fail" && "bg-fail/30",
          )}
        />
      ))}
    </span>
  );
}

function DealCard({ deal, dragging, overlay }: { deal: Deal; dragging?: boolean; overlay?: boolean }) {
  const docsPct = deal.docsTotal ? deal.docsApproved / deal.docsTotal : 0;
  const fits = screenDeal(deal).filter((r) => r.status === "pass").length;
  return (
    <div
      className={cn(
        "group rounded-2xl border bg-card p-3.5 shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition",
        overlay ? "rotate-[1.5deg] shadow-xl ring-2 ring-brand/50" : "hover:-translate-y-0.5 hover:shadow-md",
        dragging && "opacity-30",
        deal.id === "harborview" && "ring-1 ring-brand/50",
      )}
    >
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="font-mono">{deal.code}</span>
        <span className="flex items-center gap-1.5">
          {deal.id === "harborview" && (
            <span className="flex items-center gap-0.5 rounded bg-brand-soft px-1 py-px text-[10px] font-semibold text-brand-strong">
              <Star className="size-2.5 fill-current" /> Demo
            </span>
          )}
          {daysAgo(deal.stageEnteredAt)}d in stage
        </span>
      </div>
      <div className="mt-2 flex items-start gap-2.5">
        <AssetTile type={deal.assetType} className="size-8 rounded-lg" />
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-semibold leading-tight text-ink">{deal.name}</div>
          <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
            {deal.city}, {deal.state} · {deal.assetType}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="font-display text-[19px] font-semibold leading-none text-ink tnum">{moneyShort(deal.loanAmount)}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{deal.productType}</div>
        </div>
        <Ring value={docsPct} size={30} label={`${deal.docsApproved}/${deal.docsTotal}`} tone={docsPct === 1 ? "#0f8a5f" : "#0d0d0e"} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-2.5">
        <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <FitDots deal={deal} /> {fits}/4 fit
        </span>
        <span className="flex items-center gap-1.5">
          {deal.openFlags > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] font-medium text-soft">
              <Flag className="size-3" />
              {deal.openFlags}
            </span>
          )}
          <PersonaAvatar id={deal.owner} size={22} />
        </span>
      </div>
    </div>
  );
}

function DraggableCard({ deal }: { deal: Deal }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => router.push(`/deals/${deal.id}`)}
      className="cursor-grab touch-none active:cursor-grabbing"
    >
      <DealCard deal={deal} dragging={isDragging} />
    </div>
  );
}

function Column({ stage, deals, highlight }: { stage: Stage; deals: Deal[]; highlight: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = deals.reduce((a, d) => a + d.loanAmount, 0);
  return (
    <div className="flex w-[284px] shrink-0 flex-col">
      <div className="mb-2.5 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-[14px] font-semibold text-ink">{STAGE_LABEL[stage]}</span>
          <span className="rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground tnum">{deals.length}</span>
        </div>
        <span className="text-[11.5px] text-muted-foreground tnum">{moneyShort(total)}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[420px] flex-1 flex-col gap-2.5 rounded-2xl border border-transparent bg-muted/50 p-2 transition",
          highlight && "border-dashed border-border",
          isOver && "border-brand bg-brand-soft/60",
        )}
      >
        {deals.map((d) => (
          <DraggableCard key={d.id} deal={d} />
        ))}
        {deals.length === 0 && (
          <div className="grid flex-1 place-items-center rounded-xl text-[12px] text-muted-foreground">Drop a deal here</div>
        )}
      </div>
    </div>
  );
}

type SortKey = "name" | "stage" | "loanAmount" | "ltc" | "ltv" | "dscr" | "debtYield" | "fit" | "days";

export default function PipelinePage() {
  const deals = useApp((s) => s.deals);
  const persona = useApp((s) => s.persona);
  const canCreate = useCan("deal.create");
  const [view, setView] = React.useState<"board" | "list">("board");
  const [q, setQ] = React.useState("");
  const [asset, setAsset] = React.useState<string>("all");
  const [product, setProduct] = React.useState<string>("all");
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<{ deal: Deal; to: Stage } | null>(null);
  const [sort, setSort] = React.useState<{ key: SortKey; dir: 1 | -1 }>({ key: "loanAmount", dir: -1 });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const filtered = deals.filter(
    (d) =>
      (asset === "all" || d.assetType === asset) &&
      (product === "all" || d.productType === product) &&
      (!q || `${d.name} ${d.city} ${d.code} ${SPONSOR[d.sponsorId]?.name}`.toLowerCase().includes(q.toLowerCase())),
  );
  const closed = filtered.filter((d) => d.stage === "declined" || d.stage === "dead");
  const activeDeal = deals.find((d) => d.id === activeId);

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const deal = deals.find((d) => d.id === e.active.id);
    const to = e.over?.id as Stage | undefined;
    if (!deal || !to || deal.stage === to) return;
    const err = checkTransition(deal, to, persona);
    if (err) {
      toast.error("Move blocked", { description: err });
      return;
    }
    setPending({ deal, to });
  };

  const assetTypes = Array.from(new Set(deals.map((d) => d.assetType))).sort() as AssetType[];
  const products = Array.from(new Set(deals.map((d) => d.productType))).sort();

  const rows = filtered
    .map((d) => {
      const m = dealMetrics(d);
      return { d, ...m, fit: screenDeal(d).filter((r) => r.status === "pass").length, days: daysAgo(d.stageEnteredAt) };
    })
    .sort((a, b) => {
      const k = sort.key;
      const av = k === "name" ? a.d.name : k === "stage" ? BOARD.indexOf(a.d.stage) : k === "loanAmount" ? a.d.loanAmount : a[k];
      const bv = k === "name" ? b.d.name : k === "stage" ? BOARD.indexOf(b.d.stage) : k === "loanAmount" ? b.d.loanAmount : b[k];
      return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
    });

  const SortHead = ({ k, children, className }: { k: SortKey; children: React.ReactNode; className?: string }) => (
    <th className={cn("px-3 py-2.5 font-medium", className)}>
      <button
        className="inline-flex items-center gap-1 hover:text-ink"
        onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? (s.dir === 1 ? -1 : 1) : -1 }))}
      >
        {children}
        <ArrowUpDown className={cn("size-3", sort.key === k ? "text-ink" : "opacity-40")} />
      </button>
    </th>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Origination"
        title="Deal Pipeline"
        description="Drag deals between stages. Transitions are allow-listed, role-checked and written to the audit trail with a reason."
        actions={
          <>
            <div className="flex rounded-xl border bg-card p-0.5 shadow-sm">
              {(
                [
                  ["board", Columns3, "Board"],
                  ["list", LayoutList, "List"],
                ] as const
              ).map(([k, Icon, label]) => (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-medium transition",
                    view === k ? "bg-ink text-white" : "text-muted-foreground hover:text-ink",
                  )}
                >
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>
            {canCreate && (
              <Button size="lg" asChild>
                <Link href="/deals/new">
                  <Plus /> New deal
                </Link>
              </Button>
            )}
          </>
        }
      />

      {/* Stage summary */}
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {BOARD.map((s) => {
          const ds = deals.filter((d) => d.stage === s);
          return (
            <div key={s} className="rounded-xl border bg-card px-3 py-2.5">
              <div className="text-[11px] text-muted-foreground">{STAGE_LABEL[s]}</div>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="font-display text-lg font-semibold text-ink tnum">{ds.length}</span>
                <span className="text-[11.5px] text-muted-foreground tnum">{moneyShort(ds.reduce((a, d) => a + d.loanAmount, 0))}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search deal, city, sponsor…" className="h-9 rounded-xl bg-card pl-9" />
        </div>
        <Select value={asset} onValueChange={setAsset}>
          <SelectTrigger className="h-9 w-44 rounded-xl bg-card">
            <SelectValue placeholder="Asset type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All asset types</SelectItem>
            {assetTypes.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={product} onValueChange={setProduct}>
          <SelectTrigger className="h-9 w-52 rounded-xl bg-card">
            <SelectValue placeholder="Product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All products</SelectItem>
            {products.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(asset !== "all" || product !== "all" || q) && (
          <Button
            variant="ghost"
            onClick={() => {
              setAsset("all");
              setProduct("all");
              setQ("");
            }}
          >
            <X /> Clear
          </Button>
        )}
        <div className="ml-auto hidden items-center gap-3 text-[11px] text-muted-foreground lg:flex">
          <span>Buy-box dots:</span>
          {PARTNERS.map((p) => p.short.replace(" SMA", "")).join(" · ")}
        </div>
      </div>

      {view === "board" ? (
        <DndContext id="pipeline-dnd" sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
          <div className="scrollbar-thin -mx-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
            <div className="flex gap-3.5">
              {BOARD.map((s) => (
                <Column key={s} stage={s} deals={filtered.filter((d) => d.stage === s)} highlight={Boolean(activeId)} />
              ))}
              <div className="flex w-[240px] shrink-0 flex-col">
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <span className="font-display text-[14px] font-semibold text-muted-foreground">Declined / Dead</span>
                  <span className="rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">{closed.length}</span>
                </div>
                <ClosedDrop />
                <div className="mt-2 space-y-2">
                  {closed.map((d) => (
                    <Link key={d.id} href={`/deals/${d.id}`} className="block rounded-xl border border-dashed bg-card/60 p-3 opacity-80 transition hover:opacity-100">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-[12.5px] font-semibold text-ink">{d.name}</span>
                        <StagePill stage={d.stage} />
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{d.closeReason}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DragOverlay>{activeDeal ? <DealCard deal={activeDeal} overlay /> : null}</DragOverlay>
        </DndContext>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-[13px]">
              <thead className="border-b bg-muted/40 text-left text-[11.5px] text-muted-foreground">
                <tr>
                  <SortHead k="name" className="pl-5">Deal</SortHead>
                  <SortHead k="stage">Stage</SortHead>
                  <th className="px-3 py-2.5 font-medium">Product</th>
                  <SortHead k="loanAmount">Request</SortHead>
                  <SortHead k="ltc">LTC</SortHead>
                  <SortHead k="ltv">LTV</SortHead>
                  <SortHead k="dscr">DSCR</SortHead>
                  <SortHead k="debtYield">Debt yield</SortHead>
                  <SortHead k="fit">Fit</SortHead>
                  <th className="px-3 py-2.5 font-medium">Owner</th>
                  <SortHead k="days">Days</SortHead>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ d, ltc, ltv, dscr, debtYield, fit, days }) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="py-2.5 pl-5 pr-3">
                      <Link href={`/deals/${d.id}`} className="flex items-center gap-2.5">
                        <AssetTile type={d.assetType} className="size-8 rounded-lg" />
                        <span>
                          <span className="block font-semibold text-ink hover:underline">{d.name}</span>
                          <span className="block text-[11.5px] text-muted-foreground">
                            {d.code} · {d.city}, {d.state}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3"><StagePill stage={d.stage} /></td>
                    <td className="px-3 text-muted-foreground">{d.productType}</td>
                    <td className="px-3 font-medium text-ink tnum">{money(d.loanAmount)}</td>
                    <td className="px-3 tnum">{pct(ltc)}</td>
                    <td className="px-3 tnum">{pct(ltv)}</td>
                    <td className="px-3 tnum">{times(dscr)}</td>
                    <td className="px-3 tnum">{pct(debtYield, 2)}</td>
                    <td className="px-3">
                      <span className="flex items-center gap-2"><FitDots deal={d} /><span className="text-muted-foreground tnum">{fit}/4</span></span>
                    </td>
                    <td className="px-3"><PersonaAvatar id={d.owner} size={24} /></td>
                    <td className="px-3 text-muted-foreground tnum">{days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-5 py-2.5 text-[11.5px] text-muted-foreground">
            <span>{rows.length} deals · metrics from stabilized NOI with a 6.00% / 30-yr take-out test</span>
            <Pill tone="neutral">Sorted by {sort.key}</Pill>
          </div>
        </div>
      )}

      <StageDialog deal={pending?.deal ?? null} to={pending?.to ?? null} onClose={() => setPending(null)} />
    </div>
  );
}

function ClosedDrop() {
  const a = useDroppable({ id: "declined" });
  const b = useDroppable({ id: "dead" });
  return (
    <div className="grid grid-cols-2 gap-2">
      <div ref={a.setNodeRef} className={cn("grid h-14 place-items-center rounded-xl border border-dashed text-[11.5px] text-muted-foreground transition", a.isOver && "border-fail bg-fail-soft text-fail")}>
        Decline
      </div>
      <div ref={b.setNodeRef} className={cn("grid h-14 place-items-center rounded-xl border border-dashed text-[11.5px] text-muted-foreground transition", b.isOver && "border-ink bg-muted text-ink")}>
        Mark dead
      </div>
    </div>
  );
}
