"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, FileScan, FileSpreadsheet, FileText, Lock, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { DOC_CLASS_LABEL } from "@/lib/data/documents";
import { relative } from "@/lib/format";
import type { DealDocument } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ClaudeChip, DocStatusPill, PageHeader, Panel, Stat } from "@/components/common/ui";

const ORDER: Record<string, number> = { needs_review: 0, ready: 1, processing: 2, approved: 3, stored: 4, missing: 5 };

export default function ReviewQueue() {
  const documents = useApp((s) => s.documents);
  const deals = useApp((s) => s.deals);
  const [tab, setTab] = React.useState<"queue" | "all">("queue");
  const extractable = documents.filter((d) => d.extractable);
  const list = (tab === "queue" ? extractable.filter((d) => d.status === "needs_review" || d.status === "ready" || d.status === "processing") : extractable).sort(
    (a, b) => ORDER[a.status] - ORDER[b.status] || (a.dealId === "harborview" ? -1 : 1),
  );
  const openFields = documents.reduce((a, d) => a + (d.status === "needs_review" ? d.fields.filter((f) => f.status !== "approved" && f.status !== "rejected").length : 0), 0);
  const openCritical = documents.reduce((a, d) => a + (d.status === "needs_review" ? d.fields.filter((f) => f.critical && f.status !== "approved" && f.status !== "rejected").length : 0), 0);

  const href = (d: DealDocument) => (d.fields.length ? `/deals/${d.dealId}/documents/${d.id}` : `/deals/${d.dealId}/documents`);
  const Icon = (d: DealDocument) => (d.format === "xlsx" ? FileSpreadsheet : d.format === "pdf-scan" ? FileScan : FileText);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Underwriting"
        title="AI Review Queue"
        description="Every AI-extracted value waits here until a person approves, edits or rejects it. Queue order uses model confidence as a soft signal only."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Documents in queue" value={extractable.filter((d) => d.status === "needs_review" || d.status === "ready").length} icon={FileText} />
        <Stat label="Fields awaiting review" value={openFields} icon={Sparkles} tone="soft" />
        <Stat label="Critical fields open" value={openCritical} icon={Lock} tone="fail" />
        <Stat label="Approved documents" value={extractable.filter((d) => d.status === "approved").length} tone="pass" icon={FileText} />
      </div>
      <Panel
        title={tab === "queue" ? "Needs attention" : "All extractable documents"}
        actions={
          <div className="flex rounded-lg bg-muted p-0.5 text-[12px]">
            {(["queue", "all"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("rounded-md px-2.5 py-1 font-medium", tab === t ? "bg-card text-ink shadow-sm" : "text-muted-foreground")}>
                {t === "queue" ? "Queue" : "All"}
              </button>
            ))}
          </div>
        }
        bodyClassName="p-0"
      >
        <ul className="divide-y">
          {list.map((d) => {
            const deal = deals.find((x) => x.id === d.dealId);
            const I = Icon(d);
            const open = d.fields.filter((f) => f.status !== "approved" && f.status !== "rejected").length;
            return (
              <li key={d.id}>
                <Link href={href(d)} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-muted/40">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted"><I className="size-[18px]" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-ink">{DOC_CLASS_LABEL[d.docClass]}</span>
                      {d.dealId === "harborview" && <ClaudeChip>Full walkthrough</ClaudeChip>}
                    </div>
                    <div className="truncate text-[12px] text-muted-foreground">
                      {deal?.name} · {d.fileName} · uploaded {relative(d.uploadedAt)}
                    </div>
                  </div>
                  {d.status === "needs_review" && d.fields.length > 0 && (
                    <span className="hidden text-[12px] font-medium text-soft sm:block">{open} to review</span>
                  )}
                  <DocStatusPill status={d.status} />
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
