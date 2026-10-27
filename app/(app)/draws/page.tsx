"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, CheckCircle2, HardHat, Sparkles, TriangleAlert, Undo2, ClipboardCheck } from "lucide-react";
import { useApp } from "@/lib/store";
import { DRAW, drawMath } from "@/lib/data/portfolio";
import { useCan } from "@/lib/hooks";
import { date, money, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClaudeChip, CodeChip, PageHeader, Panel, Pill, PreviewBanner } from "@/components/common/ui";

const FLOW = ["Submitted", "Inspector review", "AI package check", "Construction review", "Funding approval", "Funded"];

export default function DrawsPage() {
  const status = useApp((s) => s.drawStatus);
  const setStatus = useApp((s) => s.setDrawStatus);
  const canApprove = useCan("draw.approve");
  const [note, setNote] = React.useState("Fund at inspector-supported amount; hold framing invoice until conditional lien waiver received.");
  const d = drawMath();
  const current = status === "approved" ? 4 : status === "returned" ? 3 : 3;
  const reserveUsed = DRAW.lines.find((l) => l.code === "13")!;
  const reserveRemaining = DRAW.interestReserveBudget - reserveUsed.prior - reserveUsed.requested;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Construction administration"
        title={`${DRAW.loanName} · Draw #${DRAW.number}`}
        description={`Loan ${DRAW.loanId} · period ${DRAW.period} · submitted ${date(DRAW.submittedOn)} · inspection by ${DRAW.inspector} on ${date(DRAW.inspectionDate)}`}
      />
      <PreviewBanner>
        Construction draws are a later-phase module. Phase 1 already models Loan, Budget and Participation, so DrawRequest, DrawLine and
        InspectionReport plug in without migration. Claude reviews the draw package; code computes fundable amounts and retainage.
      </PreviewBanner>

      <div className="rounded-2xl border bg-card p-5">
        <ol className="grid grid-cols-3 gap-y-4 md:grid-cols-6">
          {FLOW.map((s, i) => {
            const done = i < current || (status === "approved" && i <= 4);
            const cur = i === current && status !== "approved";
            return (
              <li key={s} className="flex items-center gap-2">
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold", done ? "bg-pass text-white" : cur ? (status === "returned" ? "bg-fail text-white" : "bg-brand text-ink") : "bg-muted text-muted-foreground")}>
                  {done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className={cn("text-[12px]", done || cur ? "font-medium text-ink" : "text-muted-foreground")}>{s}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["Requested", money(d.requested), ""],
          ["Inspector-supported", money(d.fundable), d.adjustment > 0 ? `−${money(d.adjustment)} adjusted` : ""],
          ["Retainage withheld", money(d.retainage), "10% of hard costs"],
          ["Net to fund", money(d.net), ""],
          ["Interest reserve left", money(reserveRemaining), `${pct(reserveRemaining / DRAW.interestReserveBudget, 0)} of budget`],
        ].map(([k, v, s]) => (
          <div key={k} className="rounded-2xl border bg-card p-4">
            <div className="text-[11.5px] text-muted-foreground">{k}</div>
            <div className="mt-1 font-display text-[20px] font-semibold tnum">{v}</div>
            {s && <div className={cn("text-[11px]", s.startsWith("−") ? "text-soft" : "text-muted-foreground")}>{s}</div>}
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Continuation sheet (G703)" description="Budget vs prior draws vs this request · inspector % complete" className="xl:col-span-2" actions={<CodeChip>draw math · code</CodeChip>} bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-[12px]">
              <thead className="border-b bg-muted/40 text-left text-[11px] text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Line</th>
                  <th className="px-2 text-right font-medium">Budget</th>
                  <th className="px-2 text-right font-medium">Prior</th>
                  <th className="px-2 text-right font-medium">Requested</th>
                  <th className="px-2 text-right font-medium">Insp. %</th>
                  <th className="px-2 text-right font-medium">Fundable</th>
                  <th className="px-2 text-right font-medium">Retainage</th>
                  <th className="px-4 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {d.rows.map((r) => {
                  const adj = r.requested - r.fundable > 0.5;
                  return (
                    <tr key={r.code} className={cn("border-b last:border-0", adj && "bg-soft-soft/60")}>
                      <td className="px-4 py-2">
                        <span className="font-mono text-muted-foreground">{r.code}</span> <span className="font-medium text-ink">{r.label}</span>
                        <span className="ml-1.5 text-[10.5px] text-muted-foreground">{r.category}</span>
                      </td>
                      <td className="px-2 text-right tnum">{money(r.budget)}</td>
                      <td className="px-2 text-right tnum text-muted-foreground">{money(r.prior)}</td>
                      <td className="px-2 text-right tnum">{r.requested ? money(r.requested) : "—"}</td>
                      <td className="px-2 text-right tnum">{r.category === "Hard" ? pct(r.inspectorPct, 0) : "—"}</td>
                      <td className={cn("px-2 text-right font-medium tnum", adj && "text-soft")}>{r.fundable ? money(r.fundable) : "—"}</td>
                      <td className="px-2 text-right tnum text-muted-foreground">{r.retainage ? money(r.retainage) : "—"}</td>
                      <td className="px-4 text-right tnum">{money(r.balanceToFinish)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-muted/40 font-semibold">
                  <td className="px-4 py-2.5">Total</td>
                  <td className="px-2 text-right tnum">{money(d.budget)}</td>
                  <td className="px-2 text-right tnum">{money(d.prior)}</td>
                  <td className="px-2 text-right tnum">{money(d.requested)}</td>
                  <td />
                  <td className="px-2 text-right tnum">{money(d.fundable)}</td>
                  <td className="px-2 text-right tnum">{money(d.retainage)}</td>
                  <td className="px-4 text-right tnum">{money(d.balanceToFinish)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Draw package review" actions={<ClaudeChip>Claude</ClaudeChip>}>
            <ul className="space-y-2">
              {DRAW.aiChecks.map((c) => (
                <li key={c.text} className="flex gap-2.5 text-[12.5px]">
                  {c.status === "pass" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-pass" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0 text-soft" />}
                  <span className="text-ink/85">{c.text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Sparkles className="size-3 text-brand" /> Invoices, lien waivers and the inspector report read with page evidence; amounts computed by code.
            </p>
          </Panel>

          <Panel title="Construction decision" icon={HardHat}>
            {status === "review" ? (
              <div className="space-y-3">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-20 text-[12.5px]" />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    disabled={!canApprove}
                    onClick={() => {
                      setStatus("approved", note);
                      toast.success("Draw #5 approved for funding", { description: `${money(d.net)} net of retainage · routed to funding approval` });
                    }}
                  >
                    <ClipboardCheck /> Approve
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!canApprove}
                    onClick={() => {
                      setStatus("returned", note);
                      toast("Draw returned to borrower", { description: "Lien waiver and Line 05 support requested" });
                    }}
                  >
                    <Undo2 /> Return
                  </Button>
                </div>
                {!canApprove && <p className="text-[11.5px] text-muted-foreground">Switch to Director of Construction to act on this draw.</p>}
              </div>
            ) : (
              <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium", status === "approved" ? "bg-pass-soft text-pass" : "bg-fail-soft text-fail")}>
                {status === "approved" ? <CheckCircle2 className="size-4" /> : <Undo2 className="size-4" />}
                {status === "approved" ? "Approved · awaiting funding approval" : "Returned to borrower"}
              </div>
            )}
          </Panel>

          <Panel title="Budget drawn">
            <div className="space-y-2.5">
              {d.rows.filter((r) => r.category === "Hard").slice(0, 9).map((r) => (
                <div key={r.code}>
                  <div className="flex justify-between text-[11.5px]">
                    <span className="truncate text-ink">{r.label}</span>
                    <span className="text-muted-foreground tnum">{pct((r.prior + r.fundable) / r.budget, 0)}</span>
                  </div>
                  <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="bg-ink" style={{ width: `${(r.prior / r.budget) * 100}%` }} />
                    <div className="bg-brand" style={{ width: `${(r.fundable / r.budget) * 100}%` }} />
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-ink" /> Prior draws</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-brand" /> This draw</span>
              </div>
            </div>
          </Panel>
          <Pill tone="neutral">Participations: Fund I 70% · Bayline 30% fund pro rata</Pill>
        </div>
      </div>
    </div>
  );
}
