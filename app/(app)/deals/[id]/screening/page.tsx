"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, CircleX, CircleDashed, TriangleAlert, ChevronDown, Info, Landmark, Scale } from "lucide-react";
import { useApp, useDeal, nowIso } from "@/lib/store";
import { PARTNER, PARTNERS } from "@/lib/data/partners";
import { SPONSOR } from "@/lib/data/relationships";
import { factsFor } from "@/lib/engine/buybox";
import { useCan, useScreening } from "@/lib/hooks";
import { money, moneyShort, pct, times, dateTime } from "@/lib/format";
import type { RuleResult, ScreeningResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CodeChip, Panel, Pill, ScreenPill, SCREEN_TONE } from "@/components/common/ui";

function OutcomeIcon({ r }: { r: RuleResult }) {
  if (r.outcome === "missing") return <CircleDashed className="size-4 text-info" />;
  if (r.outcome === "pass") return <CheckCircle2 className="size-4 text-pass" />;
  if (r.rule.kind === "soft") return <TriangleAlert className="size-4 text-soft" />;
  return <CircleX className="size-4 text-fail" />;
}

function PartnerCard({ res, open, onToggle }: { res: ScreeningResult; open: boolean; onToggle: () => void }) {
  const p = PARTNER[res.partnerId];
  const avail = p.commitment - p.deployed - p.reserved;
  const counts = {
    pass: res.results.filter((r) => r.outcome === "pass").length,
    soft: res.results.filter((r) => r.rule.kind === "soft" && r.outcome === "fail").length,
    hard: res.results.filter((r) => r.rule.kind === "hard" && r.outcome === "fail").length,
    missing: res.results.filter((r) => r.outcome === "missing").length,
  };
  const tone = SCREEN_TONE[res.status];
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-card transition",
        tone === "pass" && "border-pass/30",
        open && "shadow-md",
      )}
    >
      <button onClick={onToggle} className="flex w-full items-center gap-4 p-4 text-left hover:bg-muted/30">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl",
            tone === "pass" && "bg-pass text-white",
            tone === "soft" && "bg-soft-soft text-soft",
            tone === "fail" && "bg-fail-soft text-fail",
            tone === "info" && "bg-info-soft text-info",
          )}
        >
          <Landmark className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-[15px] font-semibold text-ink">{p.name}</span>
            <Pill tone="neutral">{p.type}</Pill>
            <span className="font-mono text-[11px] text-muted-foreground">buy-box v{res.version}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 text-[12px] text-muted-foreground">
            <span>{counts.pass} met</span>
            {counts.soft > 0 && <span className="text-soft">{counts.soft} preference{counts.soft > 1 ? "s" : ""} missed</span>}
            {counts.hard > 0 && <span className="text-fail">{counts.hard} hard rule{counts.hard > 1 ? "s" : ""} failed</span>}
            {counts.missing > 0 && <span className="text-info">{counts.missing} required item missing</span>}
            <span>· {moneyShort(avail)} available · max hold {Math.round(p.maxHoldPct * 100)}%</span>
          </div>
        </div>
        <ScreenPill status={res.status} />
        <ChevronDown className={cn("size-4 text-muted-foreground transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t">
          <table className="w-full text-[12.5px]">
            <thead className="bg-muted/40 text-left text-[11px] text-muted-foreground">
              <tr>
                <th className="w-8 py-2 pl-4" />
                <th className="py-2 font-medium">Rule</th>
                <th className="py-2 font-medium">Type</th>
                <th className="py-2 font-medium">Requirement</th>
                <th className="py-2 pr-4 text-right font-medium">Deal</th>
              </tr>
            </thead>
            <tbody>
              {res.results.map((r) => (
                <tr key={r.rule.id} className={cn("border-t", r.outcome !== "pass" && "bg-muted/30")}>
                  <td className="py-2.5 pl-4"><OutcomeIcon r={r} /></td>
                  <td className="py-2.5 font-medium text-ink">{r.rule.label}</td>
                  <td>
                    <Pill tone={r.rule.kind === "hard" ? "ink" : r.rule.kind === "soft" ? "soft" : "info"}>
                      {r.rule.kind === "hard" ? "Hard" : r.rule.kind === "soft" ? "Preference" : "Required"}
                    </Pill>
                  </td>
                  <td className="text-muted-foreground">{r.expected}</td>
                  <td className={cn("pr-4 text-right font-medium tnum", r.outcome === "fail" && r.rule.kind === "hard" && "text-fail", r.outcome === "fail" && r.rule.kind === "soft" && "text-soft")}>
                    {r.actual}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t px-4 py-2.5 text-[11.5px] text-muted-foreground">{p.description}</div>
        </div>
      )}
    </div>
  );
}

export default function ScreeningTab() {
  const { id } = useParams<{ id: string }>();
  const deal = useDeal(id);
  const log = useApp((s) => s.log);
  const persona = useApp((s) => s.persona);
  const screening = useScreening(deal);
  const canException = useCan("exception.approve");
  const [open, setOpen] = React.useState<string | null>("fund1");
  const eligible = screening.filter((r) => r.status === "pass" || r.status === "soft_miss");
  const [alloc, setAlloc] = React.useState<number>(70);
  if (!deal) return null;

  const f = factsFor(deal, SPONSOR[deal.sponsorId]);
  const lead = eligible.find((r) => r.partnerId === "fund1") ?? eligible[0];
  const second = eligible.find((r) => r.partnerId !== lead?.partnerId);
  const leadAmt = (deal.loanAmount * alloc) / 100;
  const secondAmt = deal.loanAmount - leadAmt;
  const secondMax = second ? PARTNER[second.partnerId].maxHoldPct : 0;
  const overHold = second ? secondAmt / deal.loanAmount > secondMax + 1e-9 : false;

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Buy-box screening</h2>
            <p className="text-[13px] text-muted-foreground">
              Evaluated automatically on every save against each partner&apos;s current buy-box version. Results store the version and inputs used.
            </p>
          </div>
          <CodeChip>rules engine · JSON buy-boxes</CodeChip>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {screening.map((r) => (
            <button
              key={r.partnerId}
              onClick={() => setOpen(r.partnerId)}
              className={cn("rounded-xl border bg-card px-3 py-2.5 text-left transition hover:shadow-sm", open === r.partnerId && "border-ink/50")}
            >
              <div className="truncate text-[12px] font-medium text-ink">{PARTNER[r.partnerId].short}</div>
              <ScreenPill status={r.status} className="mt-1.5" />
            </button>
          ))}
        </div>
        {screening.map((r) => (
          <PartnerCard key={r.partnerId} res={r} open={open === r.partnerId} onToggle={() => setOpen(open === r.partnerId ? null : r.partnerId)} />
        ))}
        <div className="flex items-start gap-2.5 rounded-2xl border bg-muted/40 p-4 text-[12.5px] text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          A pass means the deal fits a partner&apos;s declared criteria at a point in time. It is not a funding commitment, credit approval
          or pricing indication: credit decisions are made by Tikova&apos;s credit committee and recorded, not made, by the system.
        </div>
      </div>

      <div className="space-y-5">
        <Panel title="Proposed capital stack" icon={Scale} description="Allocate across eligible partners">
          {lead && second ? (
            <>
              <div className="flex h-3 overflow-hidden rounded-full">
                <div className="bg-ink transition-all" style={{ width: `${alloc}%` }} />
                <div className={cn("transition-all", overHold ? "bg-fail" : "bg-brand")} style={{ width: `${100 - alloc}%` }} />
              </div>
              <div className="mt-4 space-y-3 text-[13px]">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-ink" />{PARTNER[lead.partnerId].name}</span>
                  <span className="font-semibold tnum">{alloc}% · {money(leadAmt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2"><span className={cn("size-2.5 rounded-sm", overHold ? "bg-fail" : "bg-brand")} />{PARTNER[second.partnerId].name}</span>
                  <span className="font-semibold tnum">{100 - alloc}% · {money(secondAmt)}</span>
                </div>
              </div>
              <Slider className="mt-5" min={40} max={100} step={5} value={[alloc]} onValueChange={(v) => setAlloc(v[0])} />
              {overHold && (
                <div className="mt-3 rounded-lg bg-fail-soft px-3 py-2 text-[12px] text-fail">
                  {PARTNER[second.partnerId].short} max hold is {Math.round(secondMax * 100)}% of any loan.
                </div>
              )}
              {second.status === "soft_miss" && (
                <div className="mt-3 rounded-lg bg-soft-soft px-3 py-2 text-[12px] text-soft">
                  {PARTNER[second.partnerId].short} is a soft miss on{" "}
                  {second.results.filter((x) => x.rule.kind === "soft" && x.outcome === "fail").map((x) => x.rule.label.toLowerCase()).join(", ")}.
                  Participation requires a logged exception.
                </div>
              )}
              <Button
                className="mt-4 w-full"
                variant={canException ? "default" : "outline"}
                disabled={overHold}
                onClick={() => {
                  log({
                    at: nowIso(),
                    actor: persona,
                    action: canException ? "exception.approved" : "exception.requested",
                    entityType: "Deal",
                    entityId: deal.id,
                    entityLabel: deal.name,
                    after: `${PARTNER[lead.partnerId].short} ${alloc}% / ${PARTNER[second.partnerId].short} ${100 - alloc}%`,
                    reason: second.status === "soft_miss" ? "Participation despite buy-box preference misses" : "Allocation proposal",
                  });
                  toast.success(canException ? "Exception approved & allocation recorded" : "Exception requested", {
                    description: canException ? "Rule unchanged; exception logged against this deal only." : "Routed to Founder & CEO / Partner for approval.",
                  });
                }}
              >
                {canException ? "Approve exception & record allocation" : "Request exception"}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {eligible.length === 1 ? `Only ${PARTNER[eligible[0].partnerId].name} is eligible; it can hold up to 100%.` : "No eligible partners."}
            </p>
          )}
        </Panel>

        <Panel title="Inputs used" description={`Snapshot · ${dateTime(nowIsoStable())}`} bodyClassName="p-0">
          <table className="w-full text-[12.5px]">
            <tbody>
              {[
                ["Asset type", f.assetType],
                ["Product", f.productType],
                ["State", f.state],
                ["Loan amount", money(f.loanAmount)],
                ["LTC", pct(f.ltc)],
                ["LTV (as-stabilized)", pct(f.ltv)],
                ["DSCR (6.00% / 30-yr)", times(f.dscr)],
                ["Debt yield", pct(f.debtYield, 2)],
                ["Liquidity / loan", `${f.liquidityRatio.toFixed(2)}x`],
                ["Net worth / loan", `${f.netWorthRatio.toFixed(2)}x`],
                ["Recourse", f.recourse],
                ["Phase I ESA", f.phaseOneEsa ? "On file" : "Missing"],
              ].map(([k, v]) => (
                <tr key={k} className="border-b last:border-0">
                  <td className="px-5 py-2 text-muted-foreground">{k}</td>
                  <td className="px-5 py-2 text-right font-medium text-ink tnum">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="All partners" bodyClassName="p-2">
          {PARTNERS.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-3 py-2 text-[12.5px]">
              <span className="text-ink">{p.name}</span>
              <span className="text-muted-foreground tnum">{moneyShort(p.commitment - p.deployed - p.reserved)} avail.</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

function nowIsoStable() {
  return "2026-10-27T15:00:00.000Z";
}
