"use client";

import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
import { useApp } from "@/lib/store";
import { PARTNERS } from "@/lib/data/partners";
import { screenDeal } from "@/lib/hooks";
import { moneyShort, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader, Pill } from "@/components/common/ui";

export default function PartnersPage() {
  const deals = useApp((s) => s.deals);
  const active = deals.filter((d) => !["declined", "dead"].includes(d.stage));
  const total = PARTNERS.reduce((a, p) => a + p.commitment, 0);
  const deployed = PARTNERS.reduce((a, p) => a + p.deployed, 0);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Capital"
        title="Capital Partners"
        description="Debt fund, SMAs and participation partners, each with versioned buy-box rules. A loan can have several economic owners through participations."
      />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">Total commitments</div>
          <div className="mt-1 font-display text-[26px] font-semibold tnum">{moneyShort(total)}</div>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">Deployed</div>
          <div className="mt-1 font-display text-[26px] font-semibold tnum">{moneyShort(deployed)}</div>
          <div className="text-xs text-muted-foreground">{pct(deployed / total)} of commitments</div>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">Active pipeline fits</div>
          <div className="mt-1 font-display text-[26px] font-semibold tnum">
            {active.reduce((a, d) => a + screenDeal(d).filter((r) => r.status === "pass").length, 0)}
          </div>
          <div className="text-xs text-muted-foreground">partner × deal passes across {active.length} deals</div>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {PARTNERS.map((p) => {
          const avail = p.commitment - p.deployed - p.reserved;
          const bb = p.buyBox[p.buyBox.length - 1];
          const fits = active.filter((d) => screenDeal(d).find((r) => r.partnerId === p.id)?.status === "pass");
          return (
            <Link key={p.id} href={`/capital-partners/${p.id}`} className="group rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl text-white" style={{ background: p.color }}>
                    <Landmark className="size-5" />
                  </span>
                  <div>
                    <div className="font-display text-lg font-semibold text-ink">{p.name}</div>
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <Pill tone={p.type === "Debt Fund" ? "ink" : p.type === "SMA" ? "info" : "brand"}>{p.type}</Pill>
                      buy-box v{bb.version} · effective {bb.effectiveFrom}
                    </div>
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">{p.description}</p>
              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-muted">
                <div className="bg-ink" style={{ width: `${(p.deployed / p.commitment) * 100}%` }} />
                <div className="bg-brand" style={{ width: `${(p.reserved / p.commitment) * 100}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-4 gap-3 text-[12px]">
                {[
                  ["Commitment", moneyShort(p.commitment)],
                  ["Deployed", moneyShort(p.deployed)],
                  ["Available", moneyShort(avail)],
                  ["Loans", String(p.loans)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-muted-foreground">{k}</div>
                    <div className="font-semibold text-ink tnum">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-3">
                {bb.rules.slice(0, 6).map((r) => (
                  <span key={r.id} className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] font-medium", r.kind === "hard" ? "bg-ink/[0.06] text-ink" : r.kind === "soft" ? "bg-soft-soft text-soft" : "bg-info-soft text-info")}>
                    {r.label}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-[12px] text-muted-foreground">
                <span className="font-medium text-ink">{fits.length}</span> active deal{fits.length === 1 ? "" : "s"} currently pass · max hold {Math.round(p.maxHoldPct * 100)}% · {p.coupon}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
