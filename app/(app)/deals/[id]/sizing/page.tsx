"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CheckCircle2, CircleX, Lock, Save, TriangleAlert, Calculator, History, FlaskConical, ShieldAlert } from "lucide-react";
import { useApp, useDeal, nowIso } from "@/lib/store";
import { PARTNERS } from "@/lib/data/partners";
import { FORMULA_VERSION, TIKOVA_CREDIT_POLICY, policyFromPartnerRules, size } from "@/lib/engine/sizing";
import { hash16 } from "@/lib/engine/hash";
import { APPRAISAL, PRO_FORMA, T12_TOTALS, TOTAL_USES, interestCarry } from "@/lib/data/harborview";
import { useCan } from "@/lib/hooks";
import { dateTime, money, moneyShort, pct, times } from "@/lib/format";
import type { SizingInputs, SizingPolicy, UnderwritingRun } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CodeChip, Panel, Pill, PersonaAvatar, actorName } from "@/components/common/ui";

const POLICIES: SizingPolicy[] = [
  TIKOVA_CREDIT_POLICY,
  ...PARTNERS.map((p) => policyFromPartnerRules(p.id, p.name, p.buyBox[p.buyBox.length - 1].rules, TIKOVA_CREDIT_POLICY)),
];

type Prov = { label: string; approved: boolean; href?: string };

function ProvChip({ prov }: { prov: Prov }) {
  const inner = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium",
        prov.approved ? "bg-pass-soft text-pass" : "bg-soft-soft text-soft",
      )}
    >
      {prov.approved ? <CheckCircle2 className="size-3" /> : <TriangleAlert className="size-3" />}
      {prov.label}
    </span>
  );
  return prov.href ? <Link href={prov.href}>{inner}</Link> : inner;
}

function seededRuns(): UnderwritingRun[] {
  const base: Omit<SizingInputs, "noi" | "noiBasis" | "value" | "valueBasis"> = {
    requestedLoan: 8_450_000,
    totalCost: TOTAL_USES,
    takeoutRate: 0.06,
    amortYears: 30,
    policy: TIKOVA_CREDIT_POLICY,
  };
  const r1: SizingInputs = { ...base, noi: PRO_FORMA.noi, noiBasis: "Sponsor pro forma", value: 13_100_000, valueBasis: "Broker opinion of value (pre-appraisal)" };
  return [
    {
      id: "uw-1",
      dealId: "harborview",
      number: 1,
      label: "Indicative sizing at screening (sponsor pro forma, BOV)",
      at: "2026-10-09T16:10:00.000Z",
      by: "senior_analyst",
      formulaVersion: "sizing-1.3.2",
      inputsHash: hash16(JSON.stringify(r1)),
      policyId: "tikova",
      inputs: r1,
      outputs: size(r1),
    },
  ];
}

export default function SizingTab() {
  const { id } = useParams<{ id: string }>();
  const deal = useDeal(id);
  const documents = useApp((s) => s.documents);
  const runs = useApp((s) => s.runs);
  const saveRun = useApp((s) => s.saveRun);
  const persona = useApp((s) => s.persona);
  const canRun = useCan("sizing.run");
  const isHero = id === "harborview";

  const [requested, setRequested] = React.useState<number>(deal?.loanAmount ?? 0);
  const [valueBasis, setValueBasis] = React.useState("stabilized");
  const [noiBasis, setNoiBasis] = React.useState("lesser");
  const [rate, setRate] = React.useState(6.0);
  const [amort, setAmort] = React.useState("30");
  const [policyId, setPolicyId] = React.useState("tikova");
  const [label, setLabel] = React.useState("Post-appraisal base case (lesser-of NOI)");
  const [override, setOverride] = React.useState("");

  if (!deal) return null;

  const fieldOf = (docId: string, fid: string) => documents.find((d) => d.id === docId)?.fields.find((f) => f.id === fid);
  const fv = (docId: string, fid: string, fallback: number) => {
    const f = fieldOf(docId, fid);
    return f && f.status !== "rejected" && typeof f.value === "number" ? f.value : fallback;
  };
  const approved = (docId: string, fid: string) => fieldOf(docId, fid)?.status === "approved";

  // Inputs with provenance
  const tpc = isHero ? fv("hv-budget", "bud-tpc", TOTAL_USES) : deal.totalCost;
  const tpcProv: Prov = isHero
    ? { label: approved("hv-budget", "bud-tpc") ? "Approved · Budget p.2" : "Unapproved · Budget p.2", approved: approved("hv-budget", "bud-tpc"), href: "/deals/harborview/documents/hv-budget" }
    : { label: "Intake data", approved: false };

  const values: Record<string, { v: number; prov: Prov; label: string }> = isHero
    ? {
        stabilized: { v: fv("hv-appraisal", "ap-asstab", APPRAISAL.asStabilized), label: "As-stabilized (appraisal)", prov: { label: approved("hv-appraisal", "ap-asstab") ? "Approved · Appraisal p.112" : "Needs review · Appraisal p.112", approved: approved("hv-appraisal", "ap-asstab"), href: "/deals/harborview/documents/hv-appraisal" } },
        complete: { v: fv("hv-appraisal", "ap-ascomp", APPRAISAL.asComplete), label: "As-complete (appraisal)", prov: { label: approved("hv-appraisal", "ap-ascomp") ? "Approved · Appraisal p.112" : "Needs review · Appraisal p.112", approved: approved("hv-appraisal", "ap-ascomp"), href: "/deals/harborview/documents/hv-appraisal" } },
        asis: { v: fv("hv-appraisal", "ap-asis", APPRAISAL.asIs), label: "As-is (appraisal)", prov: { label: approved("hv-appraisal", "ap-asis") ? "Approved · Appraisal p.112" : "Needs review · Appraisal p.112", approved: approved("hv-appraisal", "ap-asis"), href: "/deals/harborview/documents/hv-appraisal" } },
      }
    : { stabilized: { v: deal.stabilizedValue, label: "As-stabilized (intake)", prov: { label: "Intake data", approved: false } } };

  const apprNoi = isHero ? fv("hv-appraisal", "ap-noi", APPRAISAL.noi) : deal.stabilizedNoi;
  const t12Noi = isHero ? fv("hv-t12", "t12-noi", T12_TOTALS.noiNormalized) : deal.inPlaceNoi ?? deal.stabilizedNoi * 0.6;
  const nois: Record<string, { v: number; prov: Prov; label: string }> = isHero
    ? {
        lesser: { v: Math.min(apprNoi, PRO_FORMA.noi), label: "Lesser of appraisal / pro forma (policy)", prov: { label: approved("hv-appraisal", "ap-noi") ? "Approved · Appraisal p.87" : "Needs review · Appraisal p.87", approved: approved("hv-appraisal", "ap-noi"), href: "/deals/harborview/documents/hv-appraisal" } },
        appraisal: { v: apprNoi, label: "Appraisal stabilized NOI", prov: { label: approved("hv-appraisal", "ap-noi") ? "Approved · Appraisal p.87" : "Needs review · Appraisal p.87", approved: approved("hv-appraisal", "ap-noi"), href: "/deals/harborview/documents/hv-appraisal" } },
        proforma: { v: PRO_FORMA.noi, label: "Sponsor pro forma NOI", prov: { label: "Underwriter assumption", approved: true } },
        t12: { v: t12Noi, label: "T-12 in-place (normalized)", prov: { label: approved("hv-t12", "t12-noi") ? "Approved · T-12 p.1" : "Needs review · T-12 p.1", approved: approved("hv-t12", "t12-noi"), href: "/deals/harborview/documents/hv-t12" } },
      }
    : { lesser: { v: deal.stabilizedNoi, label: "Stabilized NOI (intake)", prov: { label: "Intake data", approved: false } } };

  const vSel = values[valueBasis] ?? values.stabilized;
  const nSel = nois[noiBasis] ?? Object.values(nois)[0];
  const policy = POLICIES.find((p) => p.id === policyId) ?? TIKOVA_CREDIT_POLICY;
  const inputs: SizingInputs = {
    requestedLoan: requested,
    totalCost: tpc,
    value: vSel.v,
    valueBasis: vSel.label,
    noi: nSel.v,
    noiBasis: nSel.label,
    takeoutRate: rate / 100,
    amortYears: Number(amort),
    policy,
  };
  const out = size(inputs);
  const unapproved = [tpcProv, vSel.prov, nSel.prov].filter((p) => !p.approved);
  const inputsHash = hash16(JSON.stringify(inputs));
  const binding = out.constraints.find((c) => c.key === out.binding)!;
  const maxBar = Math.max(...out.constraints.map((c) => c.maxLoan), requested) * 1.06;

  const scenarios = [
    { name: "Base case", i: inputs },
    { name: "Take-out rate +25 bps", i: { ...inputs, takeoutRate: inputs.takeoutRate + 0.0025 } },
    { name: "Take-out rate +50 bps", i: { ...inputs, takeoutRate: inputs.takeoutRate + 0.005 } },
    { name: "NOI −10%", i: { ...inputs, noi: inputs.noi * 0.9 } },
    { name: "Value −10%", i: { ...inputs, value: inputs.value * 0.9 } },
  ].map((s) => ({ ...s, o: size(s.i) }));

  const history = [...(isHero ? seededRuns() : []), ...runs.filter((r) => r.dealId === deal.id)];
  const carry = isHero ? interestCarry() : null;

  const save = () => {
    const number = history.length + 1;
    const run: UnderwritingRun = {
      id: `uw-${deal.id}-${number}`,
      dealId: deal.id,
      number,
      label: label.trim() || `Run #${number}`,
      at: nowIso(),
      by: persona,
      formulaVersion: FORMULA_VERSION,
      inputsHash,
      policyId,
      inputs,
      outputs: out,
    };
    saveRun(run);
    toast.success(`Saved UW Run #${number}`, { description: `Immutable · ${FORMULA_VERSION} · inputs ${inputsHash.slice(0, 10)}` });
    setOverride("");
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      {/* Inputs */}
      <div className="space-y-5">
        <Panel title="Inputs" icon={Calculator} description="Approved values only; overrides need a logged reason">
          <div className="space-y-5">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Requested loan</label>
              <Input
                value={requested.toLocaleString("en-US")}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[^0-9]/g, ""));
                  if (Number.isFinite(n)) setRequested(n);
                }}
                className="mt-1.5 h-10 font-display text-lg font-semibold tnum"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Total project cost</label>
                <ProvChip prov={tpcProv} />
              </div>
              <div className="mt-1.5 rounded-lg border bg-muted/40 px-3 py-2 font-semibold tnum">{money(tpc)}</div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Value basis</label>
                <ProvChip prov={vSel.prov} />
              </div>
              <Select value={valueBasis} onValueChange={setValueBasis}>
                <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(values).map(([k, x]) => (
                    <SelectItem key={k} value={k}>{x.label} · {moneyShort(x.v)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">NOI basis</label>
                <ProvChip prov={nSel.prov} />
              </div>
              <Select value={noiBasis} onValueChange={setNoiBasis}>
                <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(nois).map(([k, x]) => (
                    <SelectItem key={k} value={k}>{x.label} · {money(x.v)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Take-out test rate</label>
                <span className="font-mono text-sm font-semibold">{rate.toFixed(2)}%</span>
              </div>
              <Slider className="mt-3" min={5} max={8} step={0.05} value={[rate]} onValueChange={(v) => setRate(Number(v[0].toFixed(2)))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Amortization</label>
                <Select value={amort} onValueChange={setAmort}>
                  <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30-year</SelectItem>
                    <SelectItem value="25">25-year</SelectItem>
                    <SelectItem value="0">Interest-only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Loan constant</label>
                <div className="mt-1.5 rounded-lg border bg-muted/40 px-3 py-2 text-sm font-semibold tnum">{pct(out.loanConstant, 3)}</div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Size against policy</label>
              <Select value={policyId} onValueChange={setPolicyId}>
                <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POLICIES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10.5px]">
                {[
                  ["LTC ≤", pct(policy.maxLtc, 1)],
                  ["LTV ≤", pct(policy.maxLtv, 1)],
                  ["DSCR ≥", times(policy.minDscr)],
                  ["DY ≥", pct(policy.minDebtYield, 1)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-md bg-muted/60 py-1">
                    <div className="text-muted-foreground">{k}</div>
                    <div className="font-semibold text-ink">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Formula" icon={Lock} actions={<CodeChip>{FORMULA_VERSION}</CodeChip>}>
          <pre className="overflow-x-auto rounded-lg bg-ink p-3 font-mono text-[10.5px] leading-relaxed text-zinc-300">
{`LTC   = loan / total_project_cost
LTV   = loan / value
DSCR  = NOI / (loan × constant)
DY    = NOI / loan

max_ltc  = LTC_max × cost
max_ltv  = LTV_max × value
max_dscr = NOI / (DSCR_min × constant)
max_dy   = NOI / DY_min
max_loan = min(…)   binding = argmin(…)`}
          </pre>
          <p className="mt-2 text-[11px] text-muted-foreground">Claude never computes or restates these numbers. Production uses fixed-precision decimals and is validated against Tikova&apos;s Excel model.</p>
        </Panel>
      </div>

      {/* Outputs */}
      <div className="min-w-0 space-y-5">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <motion.div layout className="bg-grid-dark relative overflow-hidden rounded-2xl bg-ink p-5 text-white">
            <div className="absolute -right-16 -top-16 size-52 rounded-full bg-[radial-gradient(circle,rgba(217,146,46,0.4),transparent_65%)]" />
            <div className="relative">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Maximum loan</div>
              <div className="mt-1 font-display text-[40px] font-semibold leading-none tnum">{money(out.maxLoan)}</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-brand px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink">Binding: {binding.label}</span>
                <span className={cn("text-[13px] font-medium", out.headroom >= 0 ? "text-emerald-300" : "text-red-300")}>
                  {out.headroom >= 0 ? `${money(out.headroom)} headroom vs request` : `Request exceeds max by ${money(-out.headroom)}`}
                </span>
              </div>
              <div className="mt-4 text-[11.5px] text-zinc-400">
                Requested {money(requested)} · {policy.label}
              </div>
            </div>
          </motion.div>
          <div className="grid grid-cols-2 gap-3">
            {out.constraints.map((c) => (
              <div key={c.key} className={cn("rounded-2xl border bg-card p-3.5", !c.passes && "border-fail/40 bg-fail-soft/40", c.key === out.binding && "ring-2 ring-brand/50")}>
                <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
                  {c.label}
                  {c.passes ? <CheckCircle2 className="size-4 text-pass" /> : <CircleX className="size-4 text-fail" />}
                </div>
                <div className="mt-1 font-display text-2xl font-semibold text-ink tnum">
                  {c.key === "dscr" ? times(c.actual) : pct(c.actual, c.key === "debtYield" ? 2 : 1)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {c.key === "ltc" || c.key === "ltv" ? "max" : "min"} {c.key === "dscr" ? times(c.threshold) : pct(c.threshold, 1)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Panel title="Max loan by constraint" description="The lowest bar binds. Amber line = requested loan.">
          <div className="space-y-3">
            {out.constraints.map((c) => (
              <div key={c.key} className="grid grid-cols-[110px_1fr_120px] items-center gap-3 text-[12.5px]">
                <span className="text-muted-foreground">{c.label}</span>
                <div className="relative h-7 rounded-lg bg-muted">
                  <motion.div
                    className={cn("h-7 rounded-lg", c.key === out.binding ? "bg-brand" : "bg-ink/85")}
                    initial={false}
                    animate={{ width: `${(c.maxLoan / maxBar) * 100}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                  <div className="absolute inset-y-[-4px] w-0.5 rounded bg-brand-strong" style={{ left: `${(requested / maxBar) * 100}%` }} />
                </div>
                <span className={cn("text-right font-semibold tnum", c.key === out.binding ? "text-brand-strong" : "text-ink")}>{money(c.maxLoan)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Scenarios" icon={FlaskConical} description="Each scenario is a separate deterministic run; the memo references a chosen run" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[12.5px]">
              <thead className="border-b bg-muted/40 text-left text-[11px] text-muted-foreground">
                <tr>
                  <th className="px-5 py-2 font-medium">Scenario</th>
                  <th className="px-3 py-2 text-right font-medium">Max loan</th>
                  <th className="px-3 py-2 text-right font-medium">DSCR</th>
                  <th className="px-3 py-2 text-right font-medium">Debt yield</th>
                  <th className="px-3 py-2 text-right font-medium">LTV</th>
                  <th className="px-3 py-2 font-medium">Binding</th>
                  <th className="px-5 py-2 text-right font-medium">Request</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s) => {
                  const ok = s.o.headroom >= 0;
                  return (
                    <tr key={s.name} className="border-b last:border-0">
                      <td className="px-5 py-2.5 font-medium text-ink">{s.name}</td>
                      <td className="px-3 text-right tnum">{money(s.o.maxLoan)}</td>
                      <td className={cn("px-3 text-right tnum", s.o.dscr < policy.minDscr && "font-semibold text-fail")}>{times(s.o.dscr)}</td>
                      <td className={cn("px-3 text-right tnum", s.o.debtYield < policy.minDebtYield && "font-semibold text-fail")}>{pct(s.o.debtYield, 2)}</td>
                      <td className={cn("px-3 text-right tnum", s.o.ltv > policy.maxLtv && "font-semibold text-fail")}>{pct(s.o.ltv)}</td>
                      <td className="px-3 uppercase text-muted-foreground">{s.o.binding === "debtYield" ? "DY" : s.o.binding}</td>
                      <td className="px-5 text-right">{ok ? <Pill tone="pass" dot>Within policy</Pill> : <Pill tone="fail" dot>Breach</Pill>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Save underwriting run" icon={Save} description="Runs are immutable; changed inputs create a new run">
            <div className="space-y-3">
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Run label" />
              {unapproved.length > 0 && (
                <div className="space-y-2 rounded-xl border border-soft/30 bg-soft-soft p-3">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-soft">
                    <ShieldAlert className="size-4" /> {unapproved.length} input{unapproved.length > 1 ? "s are" : " is"} not approved
                  </div>
                  <p className="text-[11.5px] text-ink/70">
                    {unapproved.map((u) => u.label).join(" · ")}. Approve the fields, or record an override reason.
                  </p>
                  <Input value={override} onChange={(e) => setOverride(e.target.value)} placeholder="Override reason (logged)" className="h-8 bg-card text-[12.5px]" />
                </div>
              )}
              <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span className="font-mono">inputs_hash {inputsHash}</span>
                <span className="font-mono">{FORMULA_VERSION}</span>
              </div>
              <Button className="w-full" disabled={!canRun || (unapproved.length > 0 && !override.trim())} onClick={save}>
                <Save /> Save as UW Run #{history.length + 1}
              </Button>
              {!canRun && <p className="text-center text-[11px] text-muted-foreground">Your role can view sizing but not save runs.</p>}
            </div>
          </Panel>

          <Panel title="Run history" icon={History} bodyClassName="p-2">
            <ul>
              {history.length === 0 && <li className="px-3 py-4 text-sm text-muted-foreground">No saved runs yet.</li>}
              {[...history].reverse().map((r) => (
                <li key={r.id} className="flex gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/50">
                  <PersonaAvatar id={r.by} size={26} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[12.5px] font-semibold text-ink">#{r.number} · {r.label}</span>
                      <span className="shrink-0 font-semibold tnum text-[12.5px]">{moneyShort(r.outputs.maxLoan)}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {dateTime(r.at)} · {actorName(r.by)} · {r.formulaVersion} · binding {r.outputs.binding === "debtYield" ? "DY" : r.outputs.binding.toUpperCase()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {carry && (
          <Panel title="Interest reserve adequacy" description="24-month carry projection · renovation draws + NOI ramp · code">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <div className="text-[11px] text-muted-foreground">Reserve</div>
                <div className="font-display text-xl font-semibold tnum">{money(carry.reserve)}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">Projected shortfall</div>
                <div className="font-display text-xl font-semibold tnum">{money(carry.shortfall)}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">Coverage</div>
                <div className={cn("font-display text-xl font-semibold tnum", carry.coverage < 1.1 ? "text-soft" : "text-pass")}>{pct(carry.coverage, 0)}</div>
              </div>
              <Pill tone={carry.coverage < 1.1 ? "soft" : "pass"} dot>
                {carry.coverage < 1.1 ? "Thin vs 110% policy target" : "Adequate"}
              </Pill>
            </div>
            <div className="mt-4 flex h-16 items-end gap-1">
              {carry.rows.map((r) => (
                <div key={r.month} className="flex-1" title={`Month ${r.month}: shortfall ${money(r.shortfall)}`}>
                  <div className="rounded-t bg-ink/80" style={{ height: `${(r.shortfall / Math.max(...carry.rows.map((x) => x.shortfall))) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10.5px] text-muted-foreground">
              <span>Month 1</span>
              <span>Monthly carry shortfall (interest − NOI)</span>
              <span>Month 24</span>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
