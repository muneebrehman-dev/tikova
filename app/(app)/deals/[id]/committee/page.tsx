"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, CircleDashed, TriangleAlert, ArrowRight } from "lucide-react";
import { useApp, useDeal } from "@/lib/store";
import { CommitteePanel } from "@/components/deals/committee-panel";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/common/ui";

export default function DealCommittee() {
  const { id } = useParams<{ id: string }>();
  const deal = useDeal(id);
  const documents = useApp((s) => s.documents);
  const runs = useApp((s) => s.runs);
  if (!deal) return null;

  if (deal.stage === "committee" || deal.stage === "approved" || (deal.stage === "declined" && deal.history.some((h) => h.from === "committee"))) {
    return <CommitteePanel deal={deal} />;
  }

  const docs = documents.filter((d) => d.dealId === deal.id);
  const critical = docs.flatMap((d) => d.fields.filter((f) => f.critical));
  const critOk = critical.filter((f) => f.status === "approved").length;
  const hasRun = runs.some((r) => r.dealId === deal.id);
  const items = [
    { ok: critical.length > 0 && critOk === critical.length, warn: false, label: `Critical fields approved (${critOk}/${critical.length})`, href: `/deals/${deal.id}/documents` },
    { ok: hasRun, warn: !hasRun, label: hasRun ? "Underwriting run saved" : "Save an underwriting run (memo uses base case otherwise)", href: `/deals/${deal.id}/sizing` },
    { ok: true, warn: false, label: "Credit memo drafted", href: `/deals/${deal.id}/memo` },
    { ok: deal.hasPhaseOneEsa, warn: !deal.hasPhaseOneEsa, label: deal.hasPhaseOneEsa ? "Phase I ESA on file" : "Phase I ESA outstanding (can be a condition)", href: `/deals/${deal.id}/documents` },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Panel title="Committee readiness" description="Submit from the credit memo when ready" className="lg:col-span-2">
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.label}>
              <Link href={i.href} className="flex items-center gap-3 rounded-xl border px-4 py-3 text-[13px] transition hover:bg-muted/40">
                {i.ok ? <CheckCircle2 className="size-4 text-pass" /> : i.warn ? <TriangleAlert className="size-4 text-soft" /> : <CircleDashed className="size-4 text-muted-foreground" />}
                <span className="flex-1 text-ink">{i.label}</span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
        <Button className="mt-5" asChild>
          <Link href={`/deals/${deal.id}/memo`}>
            Open credit memo to submit <ArrowRight />
          </Link>
        </Button>
      </Panel>
      <Panel title="How committee works">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          The system routes the memo, records each member&apos;s vote and conditions, and applies the quorum rule. It never makes the credit
          decision: people do. Every vote is append-only in the audit trail.
        </p>
      </Panel>
    </div>
  );
}
