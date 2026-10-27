"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Clock, Gavel, CircleX, CalendarDays, FileText, ShieldCheck } from "lucide-react";
import { useApp, nowIso, type Vote, type VoteDecision } from "@/lib/store";
import { COMMITTEE_VOTERS, PERSONA } from "@/lib/data/personas";
import { dealMetrics } from "@/lib/engine/sizing";
import { money, pct, times, relative } from "@/lib/format";
import type { Deal, PersonaId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Panel, PersonaAvatar, Pill, StagePill } from "@/components/common/ui";

export const DECISION_LABEL: Record<VoteDecision, string> = {
  approve: "Approve",
  approve_conditions: "Approve with conditions",
  decline: "Decline",
  abstain: "Abstain",
};

export function committeeOutcome(votes: Partial<Record<PersonaId, Vote>>): "approved" | "declined" | "pending" {
  const cast = COMMITTEE_VOTERS.map((v) => votes[v]).filter(Boolean) as Vote[];
  const yes = cast.filter((v) => v.decision === "approve" || v.decision === "approve_conditions").length;
  const no = cast.filter((v) => v.decision === "decline").length;
  const chair = votes.ceo;
  const chairYes = chair && (chair.decision === "approve" || chair.decision === "approve_conditions");
  if (no >= 2 || (chair?.decision === "decline" && cast.length === COMMITTEE_VOTERS.length)) return "declined";
  if (yes >= 2 && chairYes) return "approved";
  if (cast.length === COMMITTEE_VOTERS.length) return yes >= 2 && chairYes ? "approved" : "declined";
  return "pending";
}

export function CommitteePanel({ deal }: { deal: Deal }) {
  const persona = useApp((s) => s.persona);
  const allVotes = useApp((s) => s.votes);
  const castVote = useApp((s) => s.castVote);
  const moveDeal = useApp((s) => s.moveDeal);
  const votes = allVotes[deal.id] ?? {};
  const [decision, setDecision] = React.useState<VoteDecision>("approve_conditions");
  const [note, setNote] = React.useState("");
  const outcome = deal.stage === "approved" ? "approved" : deal.stage === "declined" ? "declined" : committeeOutcome(votes);
  const m = dealMetrics(deal);
  const isVoter = COMMITTEE_VOTERS.includes(persona);
  const myVote = votes[persona];

  const submit = () => {
    const vote: Vote = { decision, note: note.trim(), at: nowIso() };
    castVote(deal.id, vote);
    const next = committeeOutcome({ ...votes, [persona]: vote });
    const yes = COMMITTEE_VOTERS.filter((v) => {
      const x = v === persona ? vote : votes[v];
      return x && (x.decision === "approve" || x.decision === "approve_conditions");
    }).length;
    const castCount = COMMITTEE_VOTERS.filter((v) => (v === persona ? vote : votes[v])).length;
    if (next === "approved" && deal.stage === "committee") {
      moveDeal(deal.id, "approved", `Credit committee approved ${yes}–${castCount - yes}`);
      toast.success(`${deal.name} approved`, { description: "Quorum reached with chair approval · stage moved to Approved" });
    } else if (next === "declined" && deal.stage === "committee") {
      moveDeal(deal.id, "declined", "Declined by credit committee");
      toast(`${deal.name} declined by committee`);
    } else {
      toast.success("Vote recorded", { description: "Awaiting remaining committee members" });
    }
    setNote("");
  };

  const conditions = COMMITTEE_VOTERS.map((v) => votes[v]).filter((v): v is Vote => Boolean(v && v.decision === "approve_conditions" && v.note));

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <div className="space-y-5 xl:col-span-2">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border p-5",
            outcome === "approved" && "border-pass/30 bg-pass-soft",
            outcome === "declined" && "border-fail/30 bg-fail-soft",
            outcome === "pending" && "bg-card",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "grid size-11 place-items-center rounded-xl",
                  outcome === "approved" ? "bg-pass text-white" : outcome === "declined" ? "bg-fail text-white" : "bg-ink text-white",
                )}
              >
                {outcome === "approved" ? <CheckCircle2 className="size-5" /> : outcome === "declined" ? <CircleX className="size-5" /> : <Gavel className="size-5" />}
              </span>
              <div>
                <div className="font-display text-lg font-semibold text-ink">
                  {outcome === "approved" ? "Approved by credit committee" : outcome === "declined" ? "Declined by credit committee" : "Awaiting committee decision"}
                </div>
                <div className="text-[12.5px] text-muted-foreground">
                  Quorum: 2 of 3 voting members including the chair (Founder &amp; CEO). Votes are immutable and audit-logged.
                </div>
              </div>
            </div>
            <StagePill stage={deal.stage} />
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-[12.5px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><CalendarDays className="size-4" /> Thu, Oct 29, 2026 · 10:00 AM ET</span>
            <Link href={`/deals/${deal.id}/memo`} className="flex items-center gap-1.5 font-medium text-ink hover:underline"><FileText className="size-4" /> Credit memo</Link>
            <Link href={`/deals/${deal.id}/sizing`} className="flex items-center gap-1.5 font-medium text-ink hover:underline"><ShieldCheck className="size-4" /> Sizing runs</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ["Request", money(deal.loanAmount)],
            ["LTC", pct(m.ltc)],
            ["LTV", pct(m.ltv)],
            ["DSCR", times(m.dscr)],
            ["Debt yield", pct(m.debtYield, 2)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border bg-card px-3 py-2.5">
              <div className="text-[11px] text-muted-foreground">{k}</div>
              <div className="font-display text-lg font-semibold tnum">{v}</div>
            </div>
          ))}
        </div>

        <Panel title="Votes" icon={Gavel} bodyClassName="p-0">
          <ul className="divide-y">
            {COMMITTEE_VOTERS.map((v) => {
              const vote = votes[v];
              return (
                <li key={v} className="flex items-start gap-3 px-5 py-4">
                  <PersonaAvatar id={v} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-ink">{PERSONA[v].title}</span>
                      {v === "ceo" && <Pill tone="brand">Chair</Pill>}
                      {v === persona && <Pill tone="neutral">You</Pill>}
                    </div>
                    {vote ? (
                      <>
                        <div className="mt-1 text-[12.5px] text-muted-foreground">{relative(vote.at)}</div>
                        {vote.note && <p className="mt-1.5 rounded-lg bg-muted/60 px-3 py-2 text-[12.5px] text-ink/85">{vote.note}</p>}
                      </>
                    ) : (
                      <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><Clock className="size-3.5" /> Awaiting vote</div>
                    )}
                  </div>
                  {vote && (
                    <Pill tone={vote.decision === "decline" ? "fail" : vote.decision === "abstain" ? "neutral" : "pass"} dot>
                      {DECISION_LABEL[vote.decision]}
                    </Pill>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel title="Your vote">
          {outcome !== "pending" ? (
            <p className="text-sm text-muted-foreground">The committee has reached a decision. Further changes require a new committee action.</p>
          ) : !isVoter ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                You&apos;re viewing as <b className="text-ink">{PERSONA[persona].title}</b>, who isn&apos;t a voting member.
              </p>
              <p className="text-[12.5px]">Switch role to Founder &amp; CEO, Partner or CFO (top-right) to vote.</p>
            </div>
          ) : myVote ? (
            <div className="flex items-center gap-2 text-sm text-pass">
              <CheckCircle2 className="size-4" /> You voted: {DECISION_LABEL[myVote.decision]}
            </div>
          ) : (
            <div className="space-y-3">
              {(Object.keys(DECISION_LABEL) as VoteDecision[]).map((d) => (
                <label
                  key={d}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] transition",
                    decision === d ? "border-ink bg-muted/50" : "hover:bg-muted/30",
                  )}
                >
                  <input type="radio" name="vote" className="accent-ink" checked={decision === d} onChange={() => setDecision(d)} />
                  {DECISION_LABEL[d]}
                </label>
              ))}
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={decision === "approve_conditions" ? "Conditions (required)" : "Comment (optional)"}
                className="min-h-20 text-[12.5px]"
              />
              <Button className="w-full" disabled={decision === "approve_conditions" && !note.trim()} onClick={submit}>
                Cast vote
              </Button>
            </div>
          )}
        </Panel>

        <Panel title="Consolidated conditions">
          {conditions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No committee conditions yet.</p>
          ) : (
            <ul className="space-y-2">
              {conditions.map((c, i) => (
                <li key={i} className="flex gap-2 text-[12.5px] text-ink/85">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                  {c.note}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
