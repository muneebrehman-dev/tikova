"use client";

import Link from "next/link";
import { Briefcase, HardHat, GitFork, AlertTriangle } from "lucide-react";
import { FUNDED_LOANS } from "@/lib/data/portfolio";
import { PARTNER, PARTNERS } from "@/lib/data/partners";
import { date, moneyShort, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader, Panel, Pill, PreviewBanner, Stat } from "@/components/common/ui";

export default function PortfolioPage() {
  const live = FUNDED_LOANS.filter((l) => l.status !== "Paid off");
  const commitment = live.reduce((a, l) => a + l.commitment, 0);
  const funded = live.reduce((a, l) => a + l.funded, 0);
  const wac = live.reduce((a, l) => a + l.allIn * l.funded, 0) / funded;
  const byPartner = PARTNERS.map((p) => ({
    p,
    amount: live.reduce((a, l) => a + l.funded * (l.participations.find((x) => x.partnerId === p.id)?.share ?? 0), 0),
  }));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Loan lifecycle" title="Portfolio" description="Funded loans after closing, with each loan's economic owners." />
      <PreviewBanner>
        This view runs on the same Phase 1 data model (Loan, LoanTermVersion, Participation). Servicing, interest accrual and the loan-level
        ledger behind it are built in later phases, without a schema rebuild.
      </PreviewBanner>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Loans outstanding" value={live.length} icon={Briefcase} />
        <Stat label="Total commitments" value={moneyShort(commitment)} sub={`${moneyShort(funded)} funded`} />
        <Stat label="Weighted avg. coupon" value={pct(wac, 2)} sub="Floating, 1M Term SOFR based" />
        <Stat label="Watchlist" value={live.filter((l) => l.status === "Watchlist").length} icon={AlertTriangle} tone="soft" sub="Covenant cure period" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Loans" className="xl:col-span-2" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-[13px]">
              <thead className="border-b bg-muted/40 text-left text-[11.5px] text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Loan</th>
                  <th className="px-3 font-medium">Status</th>
                  <th className="px-3 text-right font-medium">Funded / commit.</th>
                  <th className="px-3 font-medium">Rate</th>
                  <th className="px-3 font-medium">Maturity</th>
                  <th className="px-5 font-medium">Owners</th>
                </tr>
              </thead>
              <tbody>
                {FUNDED_LOANS.map((l) => (
                  <tr key={l.id} className={cn("border-b last:border-0", l.status === "Paid off" && "opacity-55")}>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-ink">{l.name}</div>
                      <div className="text-[11.5px] text-muted-foreground">{l.id} · {l.city} · {l.product}</div>
                      {l.drawNo && (
                        <Link href="/draws" className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-brand-strong hover:underline">
                          <HardHat className="size-3" /> Draw #{l.drawNo} · {Math.round((l.pctComplete ?? 0) * 100)}% complete
                        </Link>
                      )}
                    </td>
                    <td className="px-3">
                      <Pill tone={l.status === "Performing" ? "pass" : l.status === "Watchlist" ? "soft" : "neutral"} dot>{l.status}</Pill>
                    </td>
                    <td className="px-3 text-right tnum">
                      {moneyShort(l.funded)} <span className="text-muted-foreground">/ {moneyShort(l.commitment)}</span>
                    </td>
                    <td className="px-3 text-muted-foreground">{l.rate}</td>
                    <td className="px-3 text-muted-foreground">{date(l.maturity)}</td>
                    <td className="px-5">
                      <div className="flex h-2 w-28 overflow-hidden rounded-full">
                        {l.participations.map((x) => (
                          <div key={x.partnerId} style={{ width: `${x.share * 100}%`, background: PARTNER[x.partnerId].color }} title={`${PARTNER[x.partnerId].short} ${x.share * 100}%`} />
                        ))}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {l.participations.map((x) => `${PARTNER[x.partnerId].short} ${Math.round(x.share * 100)}%`).join(" · ")}
                      </div>
                      {l.participations.length > 2 && (
                        <Link href="/waterfall" className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-brand-strong hover:underline">
                          <GitFork className="size-3" /> Waterfall
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Exposure by capital partner" description="Funded balance × participation share">
          <div className="space-y-4">
            {byPartner.map(({ p, amount }) => (
              <div key={p.id}>
                <div className="flex justify-between text-[13px]">
                  <span className="text-ink">{p.name}</span>
                  <span className="font-semibold tnum">{moneyShort(amount)}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full" style={{ width: `${(amount / funded) * 100}%`, background: p.color }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[11.5px] text-muted-foreground">Row-level access: each partner&apos;s users would only ever see their own share.</p>
        </Panel>
      </div>
    </div>
  );
}
