"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, CircleDashed, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, Panel, Pill } from "@/components/common/ui";

const LIFECYCLE = [
  { name: "Origination", phase: 1, items: ["Intake & duplicate check", "Broker / sponsor CRM", "Buy-box screening", "Term sheets"], href: "/pipeline" },
  { name: "Underwriting", phase: 1, items: ["AI extraction + evidence", "Human review", "Sizing engine", "Credit memo & committee"], href: "/deals/harborview" },
  { name: "Due diligence", phase: 2, items: ["Checklists", "AI review of ESA, PCA, title, survey, insurance", "Issue tracking"] },
  { name: "Closing", phase: 2, items: ["Closing checklist", "Version control with counsel & title", "DocuSign"] },
  { name: "Construction admin", phase: 2, items: ["Draw requests", "Inspector reports", "Retainage & interest reserve", "Covenants & watchlist"], href: "/draws" },
  { name: "Servicing", phase: 3, items: ["Payment schedules", "Interest incl. draws & PIK", "Extensions, mods, payoffs"] },
  { name: "Accounting", phase: 3, items: ["Loan-level ledger", "Accruals & fee amortization", "Partner allocations"], href: "/waterfall" },
  { name: "Investor reporting", phase: 3, items: ["Partner portfolio reports", "Quarterly packages", "Data tapes · Agora"] },
];

const MILESTONES = [
  {
    m: "M1",
    title: "Discovery & Architecture",
    items: ["Current → future process maps", "Domain data model (loans, borrowers, properties, draws, partners, participations)", "Architecture, security & AI boundaries", "Wireframes & interactive prototype", "Phased roadmap for later phases"],
    done: "Written sign-off on maps, data model, architecture and M2/M3 acceptance criteria.",
  },
  {
    m: "M2",
    title: "Core Platform",
    items: ["Tikova-owned cloud: staging + production", "PostgreSQL schema & migrations", "Entra ID SSO, roles & record-level access", "Versioned document store", "Hash-chained audit trail", "Admin, CI/CD, backups, monitoring"],
    done: "Users log in with correct roles, upload and version documents, and every material change appears in the audit log.",
  },
  {
    m: "M3",
    title: "Origination + AI Underwriting",
    items: ["Deal pipeline & CRM records", "Buy-box screening per partner", "Claude extraction for 5 document classes", "Review UI with page citations", "Sizing engine (LTC, LTV, DSCR, DY)", "Draft credit memo, editable & exportable"],
    done: "On the agreed sample set: extraction is reviewable, sizing ties to Tikova's Excel model, and a draft memo is produced end to end.",
  },
];

const REAL_VS_PROTO = [
  ["Login & roles", "Role switcher, simulated SSO", "Entra ID SSO + MFA, enforced RBAC + RLS"],
  ["Data", "Fictional demo data in the browser", "PostgreSQL in Tikova's cloud, migrations, backups"],
  ["Documents", "Rendered sample pages", "Private object store, hashing, versions, antivirus"],
  ["AI extraction", "Pre-computed results, animated", "Live Claude calls via the provider abstraction"],
  ["Sizing & screening", "Real deterministic engines (as here)", "Same logic, fixed-precision decimals, tied to Tikova's Excel"],
  ["Audit trail", "In-browser hash chain", "Append-only table, same-transaction writes, chain verification job"],
];

export default function RoadmapPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plan"
        title="Lifecycle & Roadmap"
        description="The full loan lifecycle is designed into the data model now. Phase 1 builds origination and AI-assisted underwriting; later phases plug in without a rebuild."
      />

      <div className="overflow-x-auto rounded-3xl border bg-card p-5">
        <div className="flex min-w-[1100px] gap-2">
          {LIFECYCLE.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "relative flex-1 rounded-2xl border p-4",
                s.phase === 1 ? "border-ink bg-ink text-white" : "border-dashed bg-muted/30",
              )}
            >
              <div className={cn("text-[10.5px] font-bold uppercase tracking-wider", s.phase === 1 ? "text-brand" : "text-muted-foreground")}>
                {s.phase === 1 ? "Phase 1 · this contract" : `Later phase`}
              </div>
              <div className={cn("mt-1 font-display text-[15px] font-semibold", s.phase === 1 ? "text-white" : "text-ink")}>{s.name}</div>
              <ul className="mt-3 space-y-1.5">
                {s.items.map((x) => (
                  <li key={x} className={cn("flex gap-1.5 text-[11.5px] leading-snug", s.phase === 1 ? "text-zinc-300" : "text-muted-foreground")}>
                    {s.phase === 1 ? <CheckCircle2 className="mt-px size-3 shrink-0 text-brand" /> : <CircleDashed className="mt-px size-3 shrink-0" />}
                    {x}
                  </li>
                ))}
              </ul>
              {s.href && (
                <Link href={s.href} className={cn("mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium", s.phase === 1 ? "text-brand" : "text-brand-strong")}>
                  {s.phase === 1 ? "See it" : "Preview"} <ArrowRight className="size-3" />
                </Link>
              )}
            </motion.div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-[11.5px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-ink" /> Built in Phase 1</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded border border-dashed bg-muted/40" /> Modeled in Phase 1 schema, built later</span>
          <span className="flex items-center gap-1.5"><Lock className="size-3" /> No money movement, interest math or GL postings in Phase 1</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {MILESTONES.map((m) => (
          <div key={m.m} className="flex flex-col rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-ink font-display text-sm font-semibold text-white">{m.m}</span>
              <div className="font-display text-[16px] font-semibold text-ink">{m.title}</div>
            </div>
            <ul className="mt-4 flex-1 space-y-2">
              {m.items.map((x) => (
                <li key={x} className="flex gap-2 text-[12.5px] text-ink/80">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-pass" /> {x}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl bg-muted/60 p-3 text-[12px]">
              <span className="font-semibold text-ink">Done when: </span>
              <span className="text-muted-foreground">{m.done}</span>
            </div>
          </div>
        ))}
      </div>

      <Panel title="What this prototype is, and what the build delivers" description="So nothing here is mistaken for production" bodyClassName="p-0">
        <table className="w-full text-[12.5px]">
          <thead className="border-b bg-muted/40 text-left text-[11px] text-muted-foreground">
            <tr>
              <th className="px-5 py-2 font-medium">Area</th>
              <th className="px-3 py-2 font-medium">In this prototype</th>
              <th className="px-5 py-2 font-medium">In the Phase 1 build</th>
            </tr>
          </thead>
          <tbody>
            {REAL_VS_PROTO.map(([a, p, r]) => (
              <tr key={a} className="border-b last:border-0">
                <td className="px-5 py-2.5 font-medium text-ink">{a}</td>
                <td className="px-3 text-muted-foreground">{p}</td>
                <td className="px-5 text-ink">{r}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <div className="flex justify-center"><Pill tone="brand">Stack: Next.js · TypeScript · Python/FastAPI · PostgreSQL · Claude API / Bedrock · Terraform</Pill></div>
    </div>
  );
}
