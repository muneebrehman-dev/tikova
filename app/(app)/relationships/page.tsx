"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, Handshake, Search } from "lucide-react";
import { useApp } from "@/lib/store";
import { BROKERS, SPONSORS } from "@/lib/data/relationships";
import { date, daysAgo, moneyShort } from "@/lib/format";
import type { Sponsor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AssetTile, KV, PageHeader, Pill, StagePill } from "@/components/common/ui";

export default function RelationshipsPage() {
  const deals = useApp((s) => s.deals);
  const [tab, setTab] = React.useState<"sponsors" | "brokers">("sponsors");
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState<Sponsor | null>(null);

  const sponsors = SPONSORS.filter((s) => `${s.name} ${s.principal} ${s.hq}`.toLowerCase().includes(q.toLowerCase()));
  const brokers = BROKERS.filter((b) => `${b.firm} ${b.contact} ${b.city}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Relationships"
        title="Sponsors & Brokers"
        description="CRM-style records linked to every deal. Sponsor financials refresh from approved PFS extractions."
      />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border bg-card p-0.5">
          {(
            [
              ["sponsors", Building2, `Sponsors (${SPONSORS.length})`],
              ["brokers", Handshake, `Brokers (${BROKERS.length})`],
            ] as const
          ).map(([k, I, l]) => (
            <button key={k} onClick={() => setTab(k)} className={cn("flex h-8 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-medium", tab === k ? "bg-ink text-white" : "text-muted-foreground hover:text-ink")}>
              <I className="size-3.5" /> {l}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-9 rounded-xl bg-card pl-9" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="overflow-x-auto">
          {tab === "sponsors" ? (
            <table className="w-full min-w-[860px] text-[13px]">
              <thead className="border-b bg-muted/40 text-left text-[11.5px] text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Sponsor</th>
                  <th className="px-3 font-medium">Focus</th>
                  <th className="px-3 text-right font-medium">Net worth</th>
                  <th className="px-3 text-right font-medium">Liquidity</th>
                  <th className="px-3 font-medium">PFS date</th>
                  <th className="px-3 text-right font-medium">Deals</th>
                  <th className="px-5 font-medium">Rating</th>
                </tr>
              </thead>
              <tbody>
                {sponsors.map((s) => {
                  const n = deals.filter((d) => d.sponsorId === s.id).length;
                  const stale = daysAgo(s.pfsDate + "T00:00:00Z") > 180;
                  return (
                    <tr key={s.id} onClick={() => setSel(s)} className="cursor-pointer border-b last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-ink">{s.name}</div>
                        <div className="text-[11.5px] text-muted-foreground">{s.principal} · {s.hq} · est. {s.founded}</div>
                      </td>
                      <td className="px-3 text-muted-foreground">{s.focus.join(", ")}</td>
                      <td className="px-3 text-right tnum">{moneyShort(s.netWorth)}</td>
                      <td className="px-3 text-right tnum">{moneyShort(s.liquidity)}</td>
                      <td className="px-3">
                        <span className={cn("text-[12.5px]", stale ? "font-medium text-soft" : "text-muted-foreground")}>{date(s.pfsDate)}</span>
                        {stale && <Pill tone="soft" className="ml-2">Stale</Pill>}
                      </td>
                      <td className="px-3 text-right tnum">{n}</td>
                      <td className="px-5"><Pill tone={s.rating === "A" ? "pass" : s.rating === "C" ? "fail" : "neutral"}>{s.rating}</Pill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[760px] text-[13px]">
              <thead className="border-b bg-muted/40 text-left text-[11.5px] text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Firm</th>
                  <th className="px-3 font-medium">Contact</th>
                  <th className="px-3 font-medium">City</th>
                  <th className="px-3 text-right font-medium">Sourced</th>
                  <th className="px-3 text-right font-medium">Closed</th>
                  <th className="px-5 text-right font-medium">In pipeline</th>
                </tr>
              </thead>
              <tbody>
                {brokers.map((b) => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3 font-semibold text-ink">{b.firm}</td>
                    <td className="px-3 text-muted-foreground">{b.contact}{b.title !== "—" && ` · ${b.title}`}</td>
                    <td className="px-3 text-muted-foreground">{b.city}</td>
                    <td className="px-3 text-right tnum">{b.dealsSourced}</td>
                    <td className="px-3 text-right tnum">{b.dealsClosed} <span className="text-muted-foreground">({Math.round((b.dealsClosed / b.dealsSourced) * 100)}%)</span></td>
                    <td className="px-5 text-right tnum">{deals.filter((d) => d.brokerId === b.id && !["declined", "dead"].includes(d.stage)).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Sheet open={Boolean(sel)} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {sel && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-xl">{sel.name}</SheetTitle>
                <SheetDescription>{sel.principal} · {sel.hq}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 overflow-y-auto px-4 pb-6">
                <div>
                  <KV k="Net worth" v={moneyShort(sel.netWorth)} />
                  <KV k="Liquidity" v={moneyShort(sel.liquidity)} />
                  <KV k="Latest PFS" v={date(sel.pfsDate)} />
                  <KV k="Units delivered" v={sel.unitsDelivered || "—"} />
                  <KV k="Active projects" v={sel.activeProjects} />
                  <KV k="Internal rating" v={sel.rating} />
                </div>
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Deal history</div>
                  <ul className="space-y-2">
                    {deals.filter((d) => d.sponsorId === sel.id).map((d) => (
                      <li key={d.id}>
                        <Link href={`/deals/${d.id}`} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/40">
                          <AssetTile type={d.assetType} className="size-8" />
                          <span className="flex-1">
                            <span className="block text-[13px] font-semibold text-ink">{d.name}</span>
                            <span className="text-[11.5px] text-muted-foreground">{moneyShort(d.loanAmount)} · {d.productType}</span>
                          </span>
                          <StagePill stage={d.stage} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
