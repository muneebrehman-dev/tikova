"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Gavel } from "lucide-react";
import { useApp } from "@/lib/store";
import { COMMITTEE_VOTERS, PERSONA } from "@/lib/data/personas";
import { dealMetrics } from "@/lib/engine/sizing";
import { date, money, pct, times } from "@/lib/format";
import { AssetTile, Empty, PageHeader, Panel, PersonaAvatar, Pill, StagePill } from "@/components/common/ui";
import { DECISION_LABEL } from "@/components/deals/committee-panel";

export default function CommitteePage() {
  const deals = useApp((s) => s.deals);
  const votes = useApp((s) => s.votes);
  const pending = deals.filter((d) => d.stage === "committee");
  const decided = deals
    .filter((d) => d.history.some((h) => h.from === "committee"))
    .map((d) => ({ d, ev: [...d.history].reverse().find((h) => h.from === "committee")! }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Credit"
        title="Credit Committee"
        description="Memos routed for decision. Quorum: 2 of 3 voting members including the chair. The system records decisions; people make them."
      />
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card px-5 py-4">
        <span className="grid size-10 place-items-center rounded-xl bg-ink text-white"><CalendarDays className="size-5" /></span>
        <div className="flex-1">
          <div className="font-display text-[15px] font-semibold text-ink">Next meeting · Thursday, October 29, 2026 · 10:00 AM ET</div>
          <div className="text-[12.5px] text-muted-foreground">{pending.length} deal{pending.length === 1 ? "" : "s"} on the agenda · voting members: {COMMITTEE_VOTERS.map((v) => PERSONA[v].title).join(", ")}</div>
        </div>
        <div className="flex -space-x-2">
          {COMMITTEE_VOTERS.map((v) => <PersonaAvatar key={v} id={v} size={30} className="ring-2 ring-card" />)}
        </div>
      </div>

      <Panel title="On the agenda" icon={Gavel} bodyClassName="p-0">
        {pending.length === 0 ? (
          <div className="p-5"><Empty icon={CheckCircle2} title="Agenda clear">No deals awaiting a committee decision.</Empty></div>
        ) : (
          <ul className="divide-y">
            {pending.map((d) => {
              const m = dealMetrics(d);
              const v = votes[d.id] ?? {};
              return (
                <li key={d.id}>
                  <Link href={`/deals/${d.id}/committee`} className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-muted/40">
                    <AssetTile type={d.assetType} />
                    <div className="min-w-[200px] flex-1">
                      <div className="text-[14px] font-semibold text-ink">{d.name}</div>
                      <div className="text-[12px] text-muted-foreground">{d.code} · {d.productType} · {d.city}, {d.state}</div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-[12px]">
                      {[["Request", money(d.loanAmount)], ["LTC", pct(m.ltc)], ["DSCR", times(m.dscr)], ["DY", pct(m.debtYield, 2)]].map(([k, x]) => (
                        <div key={k}><div className="text-muted-foreground">{k}</div><div className="font-semibold tnum">{x}</div></div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {COMMITTEE_VOTERS.map((p) => (
                        <span key={p} title={`${PERSONA[p].title}: ${v[p] ? DECISION_LABEL[v[p]!.decision] : "pending"}`} className="relative">
                          <PersonaAvatar id={p} size={28} className={v[p] ? "" : "opacity-35"} />
                          {v[p] && <CheckCircle2 className="absolute -bottom-1 -right-1 size-3.5 rounded-full bg-card text-pass" />}
                        </span>
                      ))}
                    </div>
                    <Pill tone="info">{Object.keys(v).length}/{COMMITTEE_VOTERS.length} voted</Pill>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Recent decisions" bodyClassName="p-0">
        <ul className="divide-y">
          {decided.map(({ d, ev }) => (
            <li key={d.id}>
              <Link href={`/deals/${d.id}/committee`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40">
                <AssetTile type={d.assetType} className="size-8" />
                <div className="flex-1">
                  <div className="text-[13.5px] font-semibold text-ink">{d.name}</div>
                  <div className="text-[12px] text-muted-foreground">{ev.reason} · {date(ev.at)}</div>
                </div>
                <StagePill stage={d.stage} />
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
