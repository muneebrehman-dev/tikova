"use client";

import { ArrowLeftRight, ArrowRight, Cloud, KeyRound, Sparkles, FolderOpen, PenTool, Users, Building2, BookOpen, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, Panel, Pill } from "@/components/common/ui";

const ITEMS = [
  { name: "Microsoft Entra ID", icon: KeyRound, what: "Single sign-on with enforced MFA; roles mapped from Entra groups.", dir: "In", phase: "Phase 1 · M2", tone: "pass" as const },
  { name: "Claude API / AWS Bedrock", icon: Sparkles, what: "AI engine behind a provider abstraction. Bedrock keeps traffic inside Tikova's AWS account.", dir: "Out → In", phase: "Phase 1 · M3", tone: "pass" as const },
  { name: "Tikova-owned cloud (AWS or Azure)", icon: Cloud, what: "Private networking, KMS encryption, versioned object storage, backups with point-in-time recovery.", dir: "Host", phase: "Phase 1 · M2", tone: "pass" as const },
  { name: "Microsoft 365 / OneDrive", icon: FolderOpen, what: "Pull deal packages from shared folders; hashed and versioned on import.", dir: "In", phase: "Confirm in discovery", tone: "neutral" as const },
  { name: "DocuSign", icon: PenTool, what: "Send term sheets and closing documents; signed versions return to the document store.", dir: "Out → In", phase: "Closing phase", tone: "info" as const },
  { name: "Agora (investor portal)", icon: Users, what: "Tikova's live investor portal. Push partner-level loan data and quarterly reporting packages.", dir: "Out", phase: "Investor reporting phase", tone: "info" as const },
  { name: "IQ-EQ (fund administration)", icon: Building2, what: "Loan tapes and allocation files per capital partner, reconciled on every export.", dir: "Out", phase: "Accounting phase", tone: "info" as const },
  { name: "QuickBooks / NetSuite", icon: BookOpen, what: "GL feed from the loan-level ledger; idempotent postings with a reconciliation log.", dir: "Out", phase: "Accounting phase", tone: "info" as const },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Integrations"
        description="Phase 1 ships the integrations the platform cannot run without. Everything else sits behind adapters at the edge, so internal data stays canonical."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ITEMS.map((i) => (
          <div key={i.name} className={cn("flex flex-col rounded-2xl border bg-card p-5", i.tone === "pass" && "border-pass/30")}>
            <div className="flex items-start justify-between">
              <span className={cn("grid size-10 place-items-center rounded-xl", i.tone === "pass" ? "bg-ink text-white" : "bg-muted text-ink")}>
                <i.icon className="size-5" />
              </span>
              <Pill tone={i.tone} dot>{i.phase}</Pill>
            </div>
            <div className="mt-4 font-display text-[15px] font-semibold text-ink">{i.name}</div>
            <p className="mt-1 flex-1 text-[12.5px] leading-relaxed text-muted-foreground">{i.what}</p>
            <div className="mt-4 flex items-center gap-1.5 border-t pt-3 text-[11.5px] text-muted-foreground">
              <ArrowLeftRight className="size-3.5" /> Data flow: {i.dir}
            </div>
          </div>
        ))}
      </div>
      <Panel title="Integration principles">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Canonical data", "Internal models are never shaped around one vendor's schema."],
            ["Adapters at the edge", "Each integration is a thin adapter; domain code doesn't change when a vendor does."],
            ["Idempotent sync", "Every outbound posting carries an idempotency key and can be resumed safely."],
            ["Reconciliation log", "Each export is reconciled and logged, which is critical for GL feeds and investor tapes."],
          ].map(([t, d]) => (
            <div key={t} className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-pass" />
              <div>
                <div className="text-[13px] font-semibold text-ink">{t}</div>
                <div className="text-[12.5px] text-muted-foreground">{d}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-3 text-[12.5px] text-muted-foreground">
          <ArrowRight className="size-4" /> Integration scope and priority are confirmed during Milestone 1 discovery.
        </div>
      </Panel>
    </div>
  );
}
