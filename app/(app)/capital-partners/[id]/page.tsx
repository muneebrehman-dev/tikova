"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Braces, History, Landmark, ListChecks, PencilLine } from "lucide-react";
import { useApp } from "@/lib/store";
import { PARTNER } from "@/lib/data/partners";
import { screenDeal, useCan } from "@/lib/hooks";
import { date, money, moneyShort, pct, times } from "@/lib/format";
import type { BuyBoxRule } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Empty, PageHeader, Panel, PersonaAvatar, Pill, ScreenPill, StagePill, actorName } from "@/components/common/ui";

function ruleValue(r: BuyBoxRule) {
  const v = r.value;
  if (Array.isArray(v)) return typeof v[0] === "number" ? `${moneyShort(v[0] as number)} – ${moneyShort(v[1] as number)}` : (v as string[]).join(", ");
  if (typeof v === "boolean") return "Required";
  if (typeof v === "number") {
    if (r.metric === "dscr") return times(v);
    if (r.metric === "liquidityRatio" || r.metric === "netWorthRatio") return `${v.toFixed(2)}x loan`;
    return pct(v, 1);
  }
  return String(v);
}
const OP: Record<string, string> = { in: "∈", lte: "≤", gte: "≥", between: "between", present: "present", eq: "=" };

export default function PartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const p = PARTNER[id];
  const deals = useApp((s) => s.deals);
  const canManage = useCan("buybox.manage");
  const [view, setView] = React.useState<"rules" | "json">("rules");
  if (!p) return <Empty icon={Landmark} title="Partner not found" />;
  const bb = p.buyBox[p.buyBox.length - 1];
  const active = deals.filter((d) => !["declined", "dead"].includes(d.stage));
  const results = active.map((d) => ({ d, r: screenDeal(d).find((x) => x.partnerId === p.id)! }));
  const json = JSON.stringify({ partner_id: p.id, version: bb.version, effective_from: bb.effectiveFrom, rules: bb.rules.map(({ id, label, kind, metric, op, value, appliesTo }) => ({ id, label, kind, metric, op, value, ...(appliesTo ? { applies_to: appliesTo } : {}) })) }, null, 2);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<Link href="/capital-partners" className="hover:text-ink">Capital Partners</Link>}
        title={p.name}
        description={p.description}
        actions={
          <Button
            size="lg"
            variant={canManage ? "default" : "outline"}
            disabled={!canManage}
            onClick={() => toast("Buy-box editor", { description: `Saving changes publishes v${bb.version + 1}; past screenings stay tied to v${bb.version}.` })}
          >
            <PencilLine /> Edit buy-box (new version)
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["Type", p.type],
          ["Commitment", money(p.commitment)],
          ["Deployed", money(p.deployed)],
          ["Available", money(p.commitment - p.deployed - p.reserved)],
          ["Pass-through", p.coupon],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border bg-card p-4">
            <div className="text-[11px] text-muted-foreground">{k}</div>
            <div className="mt-1 font-display text-[17px] font-semibold text-ink tnum">{v}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel
          title={`Buy-box v${bb.version}`}
          description={`Effective ${date(bb.effectiveFrom)} · published by ${actorName(bb.publishedBy)}`}
          className="xl:col-span-2"
          actions={
            <div className="flex rounded-lg bg-muted p-0.5 text-[12px]">
              {(
                [
                  ["rules", ListChecks, "Rules"],
                  ["json", Braces, "JSON"],
                ] as const
              ).map(([k, I, l]) => (
                <button key={k} onClick={() => setView(k)} className={cn("flex items-center gap-1 rounded-md px-2.5 py-1 font-medium", view === k ? "bg-card text-ink shadow-sm" : "text-muted-foreground")}>
                  <I className="size-3.5" /> {l}
                </button>
              ))}
            </div>
          }
          bodyClassName="p-0"
        >
          {view === "rules" ? (
            <table className="w-full text-[13px]">
              <thead className="border-b bg-muted/40 text-left text-[11px] text-muted-foreground">
                <tr>
                  <th className="px-5 py-2 font-medium">Rule</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Condition</th>
                  <th className="px-5 py-2 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {bb.rules.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-5 py-2.5 font-medium text-ink">
                      {r.label}
                      {r.appliesTo && <div className="text-[11px] font-normal text-muted-foreground">Only for {r.appliesTo.join(", ")}</div>}
                    </td>
                    <td className="px-3"><Pill tone={r.kind === "hard" ? "ink" : r.kind === "soft" ? "soft" : "info"}>{r.kind === "hard" ? "Hard" : r.kind === "soft" ? "Preference" : "Required"}</Pill></td>
                    <td className="px-3 font-mono text-[12px] text-muted-foreground">{r.metric} {OP[r.op]}</td>
                    <td className="px-5 text-ink">{ruleValue(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <pre className="max-h-[460px] overflow-auto bg-ink p-5 font-mono text-[11.5px] leading-relaxed text-zinc-300">{json}</pre>
          )}
        </Panel>

        <Panel title="Version history" icon={History} description="Changing rules creates a new version; history is preserved">
          <ol className="relative space-y-4 border-l pl-5">
            {[...p.buyBox].reverse().map((v) => (
              <li key={v.version} className="relative">
                <span className={cn("absolute -left-[25px] top-1 size-2.5 rounded-full ring-4 ring-card", v.version === bb.version ? "bg-brand" : "bg-muted-foreground/40")} />
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] font-semibold text-ink">v{v.version}</span>
                  {v.version === bb.version && <Pill tone="brand">Current</Pill>}
                </div>
                <div className="text-[11.5px] text-muted-foreground">Effective {date(v.effectiveFrom)}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[12px] text-ink/80">
                  <PersonaAvatar id={v.publishedBy} size={18} /> {v.changeNote}
                </div>
              </li>
            ))}
            {p.buyBox.length === 1 && <li className="text-[12px] text-muted-foreground">Earlier versions archived before platform migration.</li>}
          </ol>
        </Panel>
      </div>

      <Panel title="Screening across active pipeline" description={`Live results against v${bb.version}`} bodyClassName="p-0">
        <table className="w-full text-[13px]">
          <tbody>
            {results.map(({ d, r }) => {
              const firstMiss = r.results.find((x) => x.outcome !== "pass");
              return (
                <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-2.5">
                    <Link href={`/deals/${d.id}/screening`} className="font-semibold text-ink hover:underline">{d.name}</Link>
                    <div className="text-[11.5px] text-muted-foreground">{d.assetType} · {d.productType} · {moneyShort(d.loanAmount)}</div>
                  </td>
                  <td className="px-3"><StagePill stage={d.stage} /></td>
                  <td className="hidden px-3 text-[12px] text-muted-foreground md:table-cell">{firstMiss ? firstMiss.reason : "All rules met"}</td>
                  <td className="px-5 text-right"><ScreenPill status={r.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
