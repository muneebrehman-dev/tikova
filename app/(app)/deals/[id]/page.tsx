"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Building, CalendarDays, MessageSquare, Sparkles, MapPin, ArrowUpRight } from "lucide-react";
import { useApp, useDeal } from "@/lib/store";
import { SPONSOR, BROKER } from "@/lib/data/relationships";
import { PARTNER } from "@/lib/data/partners";
import { STAGE_LABEL } from "@/lib/data/deals";
import { dealMetrics } from "@/lib/engine/sizing";
import { dealInsights } from "@/lib/narrative";
import { USES, SOURCES, TOTAL_USES } from "@/lib/data/harborview";
import { useCan, useScreening } from "@/lib/hooks";
import { date, dateTime, int, money, moneyShort, pct, relative, times } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ClaudeChip,
  DocStatusPill,
  KV,
  Panel,
  PersonaAvatar,
  Pill,
  ScreenPill,
  actorName,
} from "@/components/common/ui";
import { DOC_CLASS_LABEL } from "@/lib/data/documents";

export default function DealOverview() {
  const { id } = useParams<{ id: string }>();
  const deal = useDeal(id);
  const documents = useApp((s) => s.documents);
  const addNote = useApp((s) => s.addNote);
  const screening = useScreening(deal);
  const canUpload = useCan("doc.upload");
  const canMemo = useCan("memo.edit");
  const canNote = canUpload || canMemo;
  const [note, setNote] = React.useState("");
  if (!deal) return null;

  const m = dealMetrics(deal);
  const sponsor = SPONSOR[deal.sponsorId];
  const broker = BROKER[deal.brokerId];
  const docs = documents.filter((d) => d.dealId === deal.id);
  const insights = dealInsights(deal);
  const isHero = deal.id === "harborview";

  const uses = isHero
    ? USES
    : [
        { label: deal.productType === "Ground-Up Construction" ? "Total development cost" : "Purchase / refinance basis", amount: deal.totalCost },
      ];
  const sources = isHero
    ? SOURCES
    : [
        { label: "Senior loan", amount: deal.loanAmount },
        { label: "Sponsor equity", amount: deal.totalCost - deal.loanAmount },
      ];
  const totalUses = isHero ? TOTAL_USES : deal.totalCost;

  const metricRows = [
    { k: "Loan-to-cost", v: m.ltc, th: 0.8, fmt: pct, dir: "max" as const },
    { k: "Loan-to-value (as-stabilized)", v: m.ltv, th: 0.75, fmt: pct, dir: "max" as const },
    { k: "DSCR (6.00% / 30-yr take-out)", v: m.dscr, th: 1.2, fmt: (x: number) => times(x), dir: "min" as const },
    { k: "Debt yield (stabilized)", v: m.debtYield, th: 0.08, fmt: (x: number) => pct(x, 2), dir: "min" as const },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <div className="space-y-5 xl:col-span-2">
        {/* AI summary */}
        <section className="relative overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-[#fffaf2] to-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ClaudeChip>Deal brief</ClaudeChip>
              <span className="text-xs text-muted-foreground">Drafted from approved fields only · numbers inserted by code</span>
            </div>
            {isHero && (
              <Link href="/deals/harborview/documents" className="flex items-center gap-1 text-xs font-medium text-brand-strong hover:underline">
                Review evidence <ArrowUpRight className="size-3.5" />
              </Link>
            )}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {insights.map((i) => {
              const inner = (
                <div
                  className={cn(
                    "h-full rounded-xl border bg-card/90 p-3.5 transition",
                    i.href && "hover:border-ink/25 hover:shadow-sm",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        i.tone === "pass" && "bg-pass",
                        i.tone === "soft" && "bg-soft",
                        i.tone === "fail" && "bg-fail",
                        i.tone === "info" && "bg-info",
                      )}
                    />
                    <span className="text-[13px] font-semibold text-ink">{i.title}</span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{i.body}</p>
                </div>
              );
              return i.href ? (
                <Link key={i.title} href={i.href}>
                  {inner}
                </Link>
              ) : (
                <div key={i.title}>{inner}</div>
              );
            })}
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <Panel title="Property" icon={Building}>
            <div className="bg-grid relative mb-4 h-28 overflow-hidden rounded-xl border bg-[#f3f1ea]">
              <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 400 112">
                <path d="M0 70 C80 60 120 90 200 72 S320 40 400 58" stroke="#c9c5bb" strokeWidth="10" fill="none" />
                <path d="M120 0 L150 112" stroke="#dcd8ce" strokeWidth="7" />
                <path d="M290 0 L270 112" stroke="#dcd8ce" strokeWidth="7" />
                <rect x="0" y="92" width="400" height="20" fill="#cfe0ea" opacity=".6" />
              </svg>
              <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2">
                <span className="grid size-9 place-items-center rounded-full bg-ink text-white shadow-lg ring-4 ring-white">
                  <MapPin className="size-4" />
                </span>
              </div>
              <span className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink shadow-sm">
                {deal.submarket} · {deal.city}, {deal.state}
              </span>
            </div>
            <KV k="Address" v={deal.address} />
            <KV k="Asset type" v={deal.assetType} />
            {deal.units && <KV k="Units" v={int(deal.units)} />}
            {deal.sqft && <KV k={deal.units ? "Gross building area" : "Square feet"} v={`${int(deal.sqft)} SF`} />}
            {deal.yearBuilt && <KV k="Year built" v={deal.yearBuilt} />}
            <KV k="As-stabilized value" v={money(deal.stabilizedValue)} />
            {deal.asIsValue && <KV k="As-is value" v={money(deal.asIsValue)} />}
          </Panel>

          <Panel title="Loan request" icon={CalendarDays}>
            <KV k="Total commitment" v={money(deal.loanAmount)} />
            {deal.initialAdvance && <KV k="Initial advance" v={money(deal.initialAdvance)} />}
            {deal.futureFunding && <KV k="Future funding (renovation)" v={money(deal.futureFunding)} />}
            <KV k="Purpose" v={deal.purpose} />
            <KV k="Pricing" v={`1M Term SOFR + ${(deal.spreadBps / 100).toFixed(2)}%`} />
            <KV k="Term" v={`${deal.termMonths} months + 2 × 6-mo ext.`} />
            <KV k="Recourse" v={deal.recourse} />
            <KV k="Borrower" v={deal.borrowerEntity} />
            {deal.targetClose && <KV k="Target close" v={date(deal.targetClose)} />}
          </Panel>
        </div>

        <Panel title="Sources & uses" description={isHero ? "From approved budget (v3) · ties to $11,185,000" : "Summary from intake"}>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { title: "Uses", rows: uses },
              { title: "Sources", rows: sources },
            ].map((col) => (
              <div key={col.title}>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{col.title}</div>
                <div className="space-y-2">
                  {col.rows.map((r) => (
                    <div key={r.label}>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-ink">{r.label}</span>
                        <span className="font-medium tnum">{money(r.amount)}</span>
                      </div>
                      <div className="mt-1 h-1 rounded-full bg-muted">
                        <div className="h-1 rounded-full bg-ink/80" style={{ width: `${(r.amount / totalUses) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 text-[13px] font-semibold">
                    <span>Total</span>
                    <span className="tnum">{money(col.rows.reduce((a, r) => a + r.amount, 0))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Notes" icon={MessageSquare} description="Visible to the deal team · every note is audit-logged">
          {canNote && (
            <div className="mb-4 flex gap-2">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the deal team…" className="min-h-[44px]" />
              <Button
                className="self-end"
                disabled={!note.trim()}
                onClick={() => {
                  addNote(deal.id, note.trim());
                  setNote("");
                  toast.success("Note added");
                }}
              >
                Post
              </Button>
            </div>
          )}
          <ul className="space-y-4">
            {deal.notes.length === 0 && <li className="text-sm text-muted-foreground">No notes yet.</li>}
            {deal.notes.map((n) => (
              <li key={n.id} className="flex gap-3">
                <PersonaAvatar id={n.by} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[12.5px]">
                    <span className="font-semibold text-ink">{actorName(n.by)}</span>
                    <span className="text-muted-foreground">{relative(n.at)}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink/85">{n.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Right rail */}
      <div className="space-y-5">
        <Panel title="Underwriting snapshot" description="vs. Tikova credit policy" actions={<Link href={`/deals/${deal.id}/sizing`} className="text-xs font-medium text-muted-foreground hover:text-ink">Sizing →</Link>}>
          <div className="space-y-3.5">
            {metricRows.map((r) => {
              const ok = r.dir === "max" ? r.v <= r.th : r.v >= r.th;
              const ratio = r.dir === "max" ? r.v / r.th : r.th / r.v;
              return (
                <div key={r.k}>
                  <div className="flex items-baseline justify-between text-[12.5px]">
                    <span className="text-muted-foreground">{r.k}</span>
                    <span className={cn("font-semibold tnum", ok ? "text-ink" : "text-fail")}>{r.fmt(r.v)}</span>
                  </div>
                  <div className="relative mt-1.5 h-1.5 rounded-full bg-muted">
                    <div className={cn("h-1.5 rounded-full", ok ? "bg-ink" : "bg-fail")} style={{ width: `${Math.min(1, ratio) * 85}%` }} />
                    <span className="absolute -top-1 h-3.5 w-0.5 rounded bg-brand" style={{ left: "85%" }} title="Policy limit" />
                  </div>
                  <div className="mt-1 text-right text-[10.5px] text-muted-foreground">
                    {r.dir === "max" ? "max" : "min"} {r.fmt(r.th)}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Capital partner fit" actions={<Link href={`/deals/${deal.id}/screening`} className="text-xs font-medium text-muted-foreground hover:text-ink">Details →</Link>} bodyClassName="p-2">
          {screening.map((r) => (
            <Link key={r.partnerId} href={`/deals/${deal.id}/screening`} className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/60">
              <span>
                <span className="block text-[13px] font-medium text-ink">{PARTNER[r.partnerId].name}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {PARTNER[r.partnerId].type} · buy-box v{r.version}
                </span>
              </span>
              <ScreenPill status={r.status} />
            </Link>
          ))}
        </Panel>

        <Panel title="Documents" actions={<Link href={`/deals/${deal.id}/documents`} className="text-xs font-medium text-muted-foreground hover:text-ink">All →</Link>} bodyClassName="p-2">
          {docs.map((d) => (
            <Link
              key={d.id}
              href={d.extractable && d.fields.length ? `/deals/${deal.id}/documents/${d.id}` : `/deals/${deal.id}/documents`}
              className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 hover:bg-muted/60"
            >
              <span className="min-w-0 truncate text-[12.5px] text-ink">{DOC_CLASS_LABEL[d.docClass]}</span>
              <DocStatusPill status={d.status} />
            </Link>
          ))}
        </Panel>

        <Panel title="Sponsor & broker">
          <div className="space-y-3">
            <div className="rounded-xl bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ink">{sponsor?.name}</span>
                <Pill tone={sponsor?.rating === "A" ? "pass" : "neutral"}>Rating {sponsor?.rating}</Pill>
              </div>
              <div className="mt-1 text-[12px] text-muted-foreground">
                {sponsor?.principal} · {sponsor?.hq} · est. {sponsor?.founded}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                <span>NW <b className="tnum">{moneyShort(sponsor?.netWorth ?? 0)}</b></span>
                <span>Liquidity <b className="tnum">{moneyShort(sponsor?.liquidity ?? 0)}</b></span>
              </div>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <div className="text-[13px] font-semibold text-ink">{broker?.firm}</div>
              <div className="mt-1 text-[12px] text-muted-foreground">
                {broker?.contact} · {broker?.title}
              </div>
              <div className="mt-1 text-[12px] text-muted-foreground">
                {broker?.dealsSourced} sourced · {broker?.dealsClosed} closed with Tikova
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Stage history" description="Append-only DealStageHistory">
          <ol className="relative space-y-4 border-l pl-5">
            {[...deal.history].reverse().map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute -left-[25px] top-1 size-2.5 rounded-full bg-ink ring-4 ring-card" />
                <div className="text-[12.5px] font-semibold text-ink">{STAGE_LABEL[h.to]}</div>
                <div className="text-[11.5px] text-muted-foreground">
                  {dateTime(h.at)} · {actorName(h.by)}
                </div>
                <div className="mt-0.5 text-[12px] text-ink/75">{h.reason}</div>
              </li>
            ))}
          </ol>
          <Link href={`/deals/${deal.id}/activity`} className="mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-ink">
            Full activity <ArrowRight className="size-3.5" />
          </Link>
        </Panel>

        {isHero && (
          <div className="rounded-2xl border border-dashed p-4 text-[12px] leading-relaxed text-muted-foreground">
            <div className="mb-1 flex items-center gap-1.5 font-medium text-ink">
              <Sparkles className="size-3.5 text-brand" /> Suggested demo path
            </div>
            Documents → open the <b>Appraisal</b> → click a field to jump to its evidence → approve → <b>Sizing</b> →{" "}
            <b>Credit Memo</b> → submit to <b>Committee</b>.
          </div>
        )}
      </div>
    </div>
  );
}
