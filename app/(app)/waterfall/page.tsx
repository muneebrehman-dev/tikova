"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { GitFork, ScrollText } from "lucide-react";
import { runWaterfall, type ParticipationShare } from "@/lib/engine/waterfall";
import { moneyCents as money, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CodeChip, PageHeader, Panel, PreviewBanner } from "@/components/common/ui";

const BALANCE = 6_000_000;
const RATE = 0.1025;
const DAYS = 31;
const SHARES: ParticipationShare[] = [
  { partnerId: "fund1", name: "Tikova Credit Fund I", share: 0.6, coupon: 0.1, color: "#0d0d0e" },
  { partnerId: "meridian", name: "Meridian Pension SMA", share: 0.25, coupon: 0.095, color: "#2f6fb3" },
  { partnerId: "bayline", name: "Bayline Bank", share: 0.15, coupon: 0.09, color: "#7c5c2e" },
];
const INTEREST = (BALANCE * RATE * DAYS) / 360;

const EVENTS = [
  { k: "interest", label: "October interest payment", cash: INTEREST },
  { k: "paydown", label: "Interest + $500K partial paydown", cash: INTEREST + 500_000 * 1.005 },
  { k: "payoff", label: "Full payoff at maturity", cash: INTEREST + BALANCE * 1.005 },
  { k: "short", label: "Short payment (80% of interest)", cash: INTEREST * 0.8 },
] as const;

export default function WaterfallPage() {
  const [event, setEvent] = React.useState<(typeof EVENTS)[number]["k"]>("interest");
  const [cash, setCash] = React.useState(EVENTS[0].cash);
  const [late, setLate] = React.useState(false);
  const lateFees = late ? 2_500 : 0;
  const { steps, totals } = runWaterfall({ balance: BALANCE, borrowerRate: RATE, days: DAYS, cashReceived: cash + lateFees, lateFees, exitFeePct: 0.005, shares: SHARES });
  const totalCash = cash + lateFees;
  const parties = [
    ...SHARES.map((s) => ({ name: s.name, color: s.color })),
    { name: "Tikova (manager)", color: "#d9922e" },
    ...(totals["Suspense"] ? [{ name: "Suspense", color: "#a1a1aa" }] : []),
  ].map((p) => ({ ...p, amount: (totals[p.name] ?? 0) + (p.name === "Tikova (manager)" ? 0 : 0) }));

  const ledger = [
    { id: "LE-10418", date: "2026-10-31", type: "Interest accrual", memo: `${DAYS} days · Act/360 · ${pct(RATE, 2)}`, amount: INTEREST },
    { id: "LE-10419", date: "2026-11-01", type: "Cash receipt", memo: EVENTS.find((e) => e.k === event)!.label + (late ? " + late fee" : ""), amount: totalCash },
    ...steps.flatMap((s, si) =>
      s.allocations
        .filter((a) => a.amount > 0.004)
        .map((a, ai) => ({ id: `AL-${10420 + si * 10 + ai}`, date: "2026-11-01", type: `Allocation · ${s.label.split(" · ")[1]}`, memo: a.name, amount: a.amount })),
    ),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Accounting & allocations"
        title="Participations & Waterfall"
        description="Fells Point Mixed-Use (L-2601) · $6,000,000 · 1M Term SOFR + 5.95% (10.25% all-in) · three economic owners."
      />
      <PreviewBanner>
        Allocation logic is a later-phase module. The Phase 1 schema already carries Participation (share + economic terms per partner) and the
        append-only ledger shape, so this engine plugs in without migration. All math is deterministic code.
      </PreviewBanner>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-5">
          <Panel title="Payment event" icon={GitFork}>
            <div className="space-y-2">
              {EVENTS.map((e) => (
                <button
                  key={e.k}
                  onClick={() => {
                    setEvent(e.k);
                    setCash(e.cash);
                  }}
                  className={cn("flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-[12.5px] transition", event === e.k ? "border-ink bg-muted/50" : "hover:bg-muted/30")}
                >
                  <span className="font-medium text-ink">{e.label}</span>
                  <span className="text-muted-foreground tnum">{money(e.cash)}</span>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="text-xs font-medium text-muted-foreground">Cash received (editable)</label>
              <Input
                value={Math.round(cash).toLocaleString("en-US")}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[^0-9]/g, ""));
                  if (Number.isFinite(n)) setCash(n);
                }}
                className="mt-1.5 h-10 font-display text-lg font-semibold tnum"
              />
            </div>
            <label className="mt-4 flex items-center justify-between text-[12.5px]">
              <span>Include $2,500 late fee</span>
              <Switch checked={late} onCheckedChange={setLate} />
            </label>
          </Panel>
          <Panel title="Participations">
            <table className="w-full text-[12.5px]">
              <thead className="text-left text-[11px] text-muted-foreground">
                <tr><th className="pb-2 font-medium">Partner</th><th className="pb-2 text-right font-medium">Share</th><th className="pb-2 text-right font-medium">Coupon</th></tr>
              </thead>
              <tbody>
                {SHARES.map((s) => (
                  <tr key={s.partnerId} className="border-t">
                    <td className="py-2"><span className="mr-2 inline-block size-2.5 rounded-sm" style={{ background: s.color }} />{s.name}</td>
                    <td className="text-right tnum">{pct(s.share, 0)} · {money(BALANCE * s.share)}</td>
                    <td className="text-right tnum">{pct(s.coupon, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[11.5px] text-muted-foreground">Borrower pays {pct(RATE, 2)}; the spread over each partner&apos;s coupon is Tikova&apos;s servicing strip. Shares are effective-dated.</p>
          </Panel>
        </div>

        <div className="min-w-0 space-y-5">
          <Panel title="Distribution" description={`${money(totalCash)} received`} actions={<CodeChip>waterfall-0.3 · preview</CodeChip>}>
            <div className="flex h-10 overflow-hidden rounded-xl">
              {parties.filter((p) => p.amount > 0.5).map((p) => (
                <motion.div
                  key={p.name}
                  layout
                  className="grid place-items-center text-[10.5px] font-semibold text-white"
                  style={{ background: p.color, width: `${(p.amount / Math.max(totalCash, 1)) * 100}%` }}
                  title={`${p.name}: ${money(p.amount)}`}
                >
                  {p.amount / totalCash > 0.08 ? pct(p.amount / totalCash, 0) : ""}
                </motion.div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {parties.map((p) => (
                <div key={p.name} className="rounded-xl border p-3">
                  <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
                    <span className="size-2.5 rounded-sm" style={{ background: p.color }} /> {p.name}
                  </div>
                  <div className="mt-1 font-display text-lg font-semibold tnum">{money(p.amount)}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Waterfall steps" bodyClassName="p-0">
            <ol className="divide-y">
              {steps.map((s) => (
                <li key={s.key} className={cn("px-5 py-3.5", s.applied < 0.005 && "opacity-50")}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[13px] font-semibold text-ink">{s.label}</span>
                    <span className="font-semibold tnum">{money(s.applied)}</span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{s.description}</p>
                  {s.allocations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {s.allocations.filter((a) => a.amount > 0.004).map((a) => (
                        <span key={a.name} className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2 py-1 text-[11.5px]">
                          <span className="size-2 rounded-sm" style={{ background: a.color }} /> {a.name}: <b className="tnum">{money(a.amount)}</b>
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Loan-level ledger (append-only)" icon={ScrollText} description="Balances derive from the ledger; entries are never edited, only reversed" bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-[12px]">
                <thead className="border-b bg-muted/40 text-left text-[11px] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-2 font-medium">Entry</th>
                    <th className="px-3 font-medium">Date</th>
                    <th className="px-3 font-medium">Type</th>
                    <th className="px-3 font-medium">Memo</th>
                    <th className="px-5 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((l) => (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="px-5 py-2 font-mono text-muted-foreground">{l.id}</td>
                      <td className="px-3 text-muted-foreground">{l.date}</td>
                      <td className="px-3 text-ink">{l.type}</td>
                      <td className="px-3 text-muted-foreground">{l.memo}</td>
                      <td className="px-5 text-right font-medium tnum">{money(l.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
