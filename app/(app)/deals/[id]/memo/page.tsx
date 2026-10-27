"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Download, Lock, Pencil, RefreshCw, Send, Sparkles, CheckCircle2 } from "lucide-react";
import { useApp, useDeal } from "@/lib/store";
import { SPONSOR } from "@/lib/data/relationships";
import { PARTNER } from "@/lib/data/partners";
import { TRANSITIONS } from "@/lib/data/deals";
import { TIKOVA_CREDIT_POLICY, size, FORMULA_VERSION } from "@/lib/engine/sizing";
import { APPRAISAL, PRO_FORMA, RENT_ROLL_SUMMARY as RR, SOURCES, TOTAL_USES, USES } from "@/lib/data/harborview";
import { memoNarrative } from "@/lib/narrative";
import { useCan, useScreening } from "@/lib/hooks";
import { date, money, pct, times, int } from "@/lib/format";
import type { SizingInputs } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ClaudeChip, CodeChip, Pill, ScreenPill, actorName } from "@/components/common/ui";

const SECTIONS = [
  { key: "summary", title: "1. Transaction summary", kind: "code+ai" },
  { key: "recommendation", title: "2. Recommendation", kind: "ai" },
  { key: "sizing", title: "3. Sizing & underwriting", kind: "code" },
  { key: "su", title: "4. Sources & uses", kind: "code" },
  { key: "property", title: "5. Property", kind: "ai" },
  { key: "sponsor", title: "6. Sponsor", kind: "ai" },
  { key: "market", title: "7. Market", kind: "ai" },
  { key: "screening", title: "8. Capital partner screening", kind: "code" },
  { key: "risks", title: "9. Risks & mitigants", kind: "ai" },
  { key: "conditions", title: "10. Conditions precedent", kind: "ai" },
] as const;

function renderTokens(text: string, tokens: Record<string, string>, runLabel: string) {
  const parts = text.split(/(\{\{\w+\}\})/g);
  return parts.map((p, i) => {
    const m = p.match(/^\{\{(\w+)\}\}$/);
    if (!m) return <React.Fragment key={i}>{p}</React.Fragment>;
    const v = tokens[m[1]] ?? `[${m[1]}]`;
    return (
      <Tooltip key={i}>
        <TooltipTrigger asChild>
          <span className="cursor-help rounded bg-ink/[0.06] px-1 font-semibold text-ink underline decoration-brand decoration-2 underline-offset-[3px] tnum">{v}</span>
        </TooltipTrigger>
        <TooltipContent className="text-xs">
          <span className="font-mono">{`{{${m[1]}}}`}</span> inserted by code from {runLabel}. Claude never writes numbers.
        </TooltipContent>
      </Tooltip>
    );
  });
}

export default function MemoTab() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const deal = useDeal(id);
  const runs = useApp((s) => s.runs);
  const memoEdits = useApp((s) => s.memoEdits);
  const editMemo = useApp((s) => s.editMemo);
  const submitMemo = useApp((s) => s.submitMemo);
  const submitted = useApp((s) => (deal ? s.memoSubmitted[deal.id] : false));
  const moveDeal = useApp((s) => s.moveDeal);
  const persona = useApp((s) => s.persona);
  const canEdit = useCan("memo.edit");
  const screening = useScreening(deal);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [regen, setRegen] = React.useState(false);
  const [active, setActive] = React.useState("summary");

  if (!deal) return null;
  const isHero = deal.id === "harborview";
  const sponsor = SPONSOR[deal.sponsorId];
  const saved = runs.filter((r) => r.dealId === deal.id);
  const latest = saved[saved.length - 1];
  const baseInputs: SizingInputs = {
    requestedLoan: deal.loanAmount,
    totalCost: isHero ? TOTAL_USES : deal.totalCost,
    value: deal.stabilizedValue,
    valueBasis: "As-stabilized",
    noi: deal.stabilizedNoi,
    noiBasis: isHero ? "Lesser of appraisal / pro forma" : "Stabilized NOI",
    takeoutRate: 0.06,
    amortYears: 30,
    policy: TIKOVA_CREDIT_POLICY,
  };
  const out = latest ? latest.outputs : size(baseInputs);
  const inputs = latest ? latest.inputs : baseInputs;
  const runLabel = latest ? `UW Run #${latest.number}` : "the base-case sizing run";
  const narrative = memoNarrative(deal);
  const textFor = (k: string) => memoEdits[`${deal.id}:${k}`] ?? narrative[k] ?? "";

  const tokens: Record<string, string> = {
    loan: money(inputs.requestedLoan),
    initial: money(deal.initialAdvance ?? deal.loanAmount),
    future: money(deal.futureFunding ?? 0),
    avgInPlace: `${money(RR.avgContractRent)}/mo`,
    maxLoan: money(out.maxLoan),
    headroom: money(Math.max(0, out.headroom)),
    nrsf: int(RR.totalSqft),
    occupancy: pct(RR.occupancy),
    netWorth: money(sponsor?.netWorth ?? 0),
    liquidity: money(sponsor?.liquidity ?? 0),
    binding: out.binding === "debtYield" ? "debt yield" : out.binding.toUpperCase(),
  };

  const doRegen = () => {
    setRegen(true);
    setTimeout(() => {
      setRegen(false);
      toast.success("Narrative regenerated", { description: "Drafted from approved fields only · prompt memo.v5 · numbers re-inserted by code" });
    }, 1600);
  };

  const submit = () => {
    if (!canEdit) {
      toast.error("Your role can't submit credit memos.");
      return;
    }
    submitMemo(deal.id);
    if (deal.stage !== "committee" && TRANSITIONS[deal.stage].includes("committee")) {
      moveDeal(deal.id, "committee", "Credit memo submitted for committee review");
    }
    toast.success("Submitted to credit committee", { description: "Committee members notified · memo version locked" });
    router.push(`/deals/${deal.id}/committee`);
  };

  const AiBody = ({ k }: { k: string }) => {
    const edited = memoEdits[`${deal.id}:${k}`] !== undefined;
    if (editing === k) {
      return (
        <div className="no-print space-y-2">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-40 font-mono text-[12px] leading-relaxed" />
          <p className="text-[11px] text-muted-foreground">Keep numeric tokens like <span className="font-mono">{"{{loan}}"}</span>: code fills them from the selected run.</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                editMemo(`${deal.id}:${k}`, draft);
                setEditing(null);
                toast.success("Section updated", { description: "Edit attributed to " + actorName(persona) });
              }}
            >
              Save section
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      );
    }
    return (
      <div className={cn("relative", regen && "pointer-events-none")}>
        {regen && <div className="shimmer absolute inset-0 z-10 rounded-lg opacity-80" />}
        <div className="space-y-2 text-[13.5px] leading-[1.75] text-ink/90">
          {textFor(k)
            .split("\n")
            .map((line, i) => (
              <p key={i}>{renderTokens(line, tokens, runLabel)}</p>
            ))}
        </div>
        {edited && <div className="mt-2 text-[11px] text-muted-foreground">Edited by underwriter · original AI draft retained in version history</div>}
      </div>
    );
  };

  const SectionHead = ({ s }: { s: (typeof SECTIONS)[number] }) => (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-display text-[17px] font-semibold text-ink">{s.title}</h3>
      <div className="no-print flex items-center gap-2">
        {s.kind === "code" ? (
          <CodeChip>Numbers locked · {runLabel}</CodeChip>
        ) : memoEdits[`${deal.id}:${s.key}`] !== undefined ? (
          <Pill tone="info">Edited</Pill>
        ) : (
          <ClaudeChip>Drafted by Claude</ClaudeChip>
        )}
        {s.kind !== "code" && canEdit && !submitted && (
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              setEditing(s.key);
              setDraft(textFor(s.key));
            }}
          >
            <Pencil /> Edit
          </Button>
        )}
      </div>
    </div>
  );

  const T = ({ rows }: { rows: [string, React.ReactNode][] }) => (
    <table className="w-full text-[12.5px]">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} className="border-b last:border-0">
            <td className="w-1/2 py-1.5 text-muted-foreground">{k}</td>
            <td className="py-1.5 text-right font-medium text-ink tnum">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="no-print hidden xl:block">
        <div className="sticky top-24 space-y-1">
          <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Contents</div>
          {SECTIONS.map((s) => (
            <a
              key={s.key}
              href={`#memo-${s.key}`}
              onClick={() => setActive(s.key)}
              className={cn(
                "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12.5px] transition hover:bg-muted",
                active === s.key ? "bg-muted font-medium text-ink" : "text-muted-foreground",
              )}
            >
              <span className="truncate">{s.title.replace(/^\d+\.\s/, "")}</span>
              {s.kind === "code" ? <Lock className="size-3" /> : <Sparkles className="size-3 text-brand" />}
            </a>
          ))}
          <div className="mt-4 rounded-xl border bg-card p-3 text-[11.5px] leading-relaxed text-muted-foreground">
            <span className="font-medium text-ink">How this memo is built:</span> code inserts every number and table from {runLabel}; Claude drafts
            narrative from approved fields; the underwriter edits and submits.
          </div>
        </div>
      </aside>

      <div className="min-w-0 space-y-4">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
            <Pill tone={submitted ? "pass" : "neutral"} dot>{submitted ? "Submitted · locked" : "Draft v3"}</Pill>
            <span className="text-muted-foreground">Source: {runLabel} · {FORMULA_VERSION}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={doRegen} disabled={regen || submitted || !canEdit}>
              <RefreshCw className={cn(regen && "animate-spin")} /> Regenerate narrative
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Download /> Export PDF
            </Button>
            <Button size="sm" onClick={submit} disabled={submitted || deal.stage === "approved"}>
              {submitted ? <CheckCircle2 /> : <Send />} {submitted ? "Submitted" : "Submit to committee"}
            </Button>
          </div>
        </div>

        <motion.article initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="print-area paper mx-auto max-w-[860px] rounded-sm bg-white px-8 py-10 md:px-14">
          <header className="border-b-2 border-ink pb-5">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <span className="font-semibold text-ink">TIKOVA · Credit Memorandum</span>
              <span>Confidential</span>
            </div>
            <h2 className="mt-4 font-display text-[30px] font-semibold leading-tight text-ink">{deal.name}</h2>
            <div className="mt-1 text-[13px] text-muted-foreground">
              {deal.code} · {deal.productType} · {deal.city}, {deal.state} · Prepared by {actorName(deal.owner)} · {date("2026-10-27")}
            </div>
          </header>

          {SECTIONS.map((s) => (
            <section key={s.key} id={`memo-${s.key}`} className="scroll-mt-24 border-b py-6 last:border-0">
              {SectionHead({ s })}
              {s.key === "summary" && (
                <>
                  <div className="mb-4 grid gap-x-10 md:grid-cols-2">
                    <T
                      rows={[
                        ["Borrower", deal.borrowerEntity],
                        ["Sponsor / guarantor", `${sponsor?.name}`],
                        ["Loan amount", money(inputs.requestedLoan)],
                        ["Initial / future funding", deal.initialAdvance ? `${money(deal.initialAdvance)} / ${money(deal.futureFunding ?? 0)}` : "—"],
                      ]}
                    />
                    <T
                      rows={[
                        ["Pricing", `1M Term SOFR + ${(deal.spreadBps / 100).toFixed(2)}%`],
                        ["Term", `${deal.termMonths} months + 2 × 6 mo.`],
                        ["Recourse", deal.recourse],
                        ["Purpose", deal.purpose],
                      ]}
                    />
                  </div>
                  {AiBody({ k: "summary" })}
                </>
              )}
              {s.key === "recommendation" && AiBody({ k: "recommendation" })}
              {s.key === "sizing" && (
                <div className="grid gap-6 md:grid-cols-2">
                  <table className="w-full text-[12.5px]">
                    <thead className="border-b text-left text-[11px] text-muted-foreground">
                      <tr><th className="py-1.5 font-medium">Metric</th><th className="text-right font-medium">Actual</th><th className="text-right font-medium">Policy</th><th className="w-6" /></tr>
                    </thead>
                    <tbody>
                      {out.constraints.map((c) => (
                        <tr key={c.key} className="border-b last:border-0">
                          <td className="py-1.5">{c.label}</td>
                          <td className="text-right font-semibold tnum">{c.key === "dscr" ? times(c.actual) : pct(c.actual, c.key === "debtYield" ? 2 : 1)}</td>
                          <td className="text-right text-muted-foreground tnum">{c.key === "ltc" || c.key === "ltv" ? "≤ " : "≥ "}{c.key === "dscr" ? times(c.threshold) : pct(c.threshold, 1)}</td>
                          <td className="text-right">{c.passes ? <CheckCircle2 className="ml-auto size-3.5 text-pass" /> : <span className="text-fail">✕</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <T
                    rows={[
                      ["Maximum loan", money(out.maxLoan)],
                      ["Binding constraint", out.binding === "debtYield" ? "Debt yield" : out.binding.toUpperCase()],
                      ["NOI basis", `${inputs.noiBasis} · ${money(inputs.noi)}`],
                      ["Value basis", `${inputs.valueBasis} · ${money(inputs.value)}`],
                      ["Take-out test", `${(inputs.takeoutRate * 100).toFixed(2)}% / ${inputs.amortYears ? `${inputs.amortYears}-yr` : "IO"}`],
                    ]}
                  />
                </div>
              )}
              {s.key === "su" && (
                <div className="grid gap-6 md:grid-cols-2">
                  <T rows={(isHero ? USES : [{ label: "Total cost", amount: deal.totalCost }]).map((u) => [u.label, money(u.amount)] as [string, string])} />
                  <T
                    rows={(isHero ? SOURCES : [
                      { label: "Senior loan", amount: deal.loanAmount },
                      { label: "Sponsor equity", amount: deal.totalCost - deal.loanAmount },
                    ]).map((u) => [u.label, money(u.amount)] as [string, string])}
                  />
                </div>
              )}
              {s.key === "property" && (
                <>
                  {AiBody({ k: "property" })}
                  {isHero && (
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center text-[12px]">
                      {[
                        ["As-is", money(APPRAISAL.asIs)],
                        ["As-stabilized", money(APPRAISAL.asStabilized)],
                        ["Pro forma NOI", money(PRO_FORMA.noi)],
                      ].map(([k, v]) => (
                        <div key={k} className="rounded-lg border bg-muted/30 py-2.5">
                          <div className="text-muted-foreground">{k}</div>
                          <div className="font-semibold tnum">{v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              {s.key === "sponsor" && AiBody({ k: "sponsor" })}
              {s.key === "market" && AiBody({ k: "market" })}
              {s.key === "screening" && (
                <table className="w-full text-[12.5px]">
                  <tbody>
                    {screening.map((r) => (
                      <tr key={r.partnerId} className="border-b last:border-0">
                        <td className="py-2">{PARTNER[r.partnerId].name} <span className="text-muted-foreground">· v{r.version}</span></td>
                        <td className="text-right"><ScreenPill status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {s.key === "risks" && AiBody({ k: "risks" })}
              {s.key === "conditions" && AiBody({ k: "conditions" })}
            </section>
          ))}
          <footer className="pt-6 text-[11px] text-muted-foreground">
            Generated {date("2026-10-27")} · narrative prompt memo.v5 · {FORMULA_VERSION} · every figure traceable to an approved source field.
          </footer>
        </motion.article>
      </div>
    </div>
  );
}
