"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useApp, useDeal } from "@/lib/store";
import { dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Panel, PersonaAvatar, actorName } from "@/components/common/ui";

const FILTERS = [
  { k: "all", label: "All" },
  { k: "deal", label: "Stage & notes" },
  { k: "docs", label: "Documents & AI" },
  { k: "uw", label: "Underwriting" },
  { k: "credit", label: "Committee & exceptions" },
] as const;

function bucket(action: string): (typeof FILTERS)[number]["k"] {
  if (action.startsWith("deal.") || action.startsWith("note.")) return "deal";
  if (action.startsWith("document.") || action.startsWith("extraction.") || action.startsWith("field.") || action.startsWith("pii.")) return "docs";
  if (action.startsWith("underwriting.") || action.startsWith("buybox.") || action.startsWith("memo.") || action.startsWith("termsheet.")) return "uw";
  return "credit";
}

export default function ActivityTab() {
  const { id } = useParams<{ id: string }>();
  const deal = useDeal(id);
  const audit = useApp((s) => s.audit);
  const documents = useApp((s) => s.documents);
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]["k"]>("all");
  if (!deal) return null;
  const docIds = new Set(documents.filter((d) => d.dealId === deal.id).map((d) => d.id));
  const fieldIds = new Set(documents.filter((d) => d.dealId === deal.id).flatMap((d) => d.fields.map((f) => f.id)));
  const events = audit
    .filter((e) => e.entityId === deal.id || docIds.has(e.entityId) || fieldIds.has(e.entityId) || e.entityId.startsWith(`uw-${deal.id}`) || (deal.id === "harborview" && e.entityId.startsWith("run_")))
    .filter((e) => filter === "all" || bucket(e.action) === filter)
    .reverse();

  return (
    <Panel
      title="Deal activity"
      description="Every state change on this deal, from the append-only audit trail"
      actions={
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-medium transition", filter === f.k ? "bg-ink text-white" : "bg-muted text-muted-foreground hover:text-ink")}
            >
              {f.label}
            </button>
          ))}
        </div>
      }
    >
      <ol className="relative space-y-5 border-l pl-6">
        {events.length === 0 && <li className="text-sm text-muted-foreground">No events for this filter.</li>}
        {events.map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -left-[37px] top-0">
              <PersonaAvatar id={e.actor} size={26} className="ring-4 ring-card" />
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-[13px] text-ink">
                <span className="font-semibold">{actorName(e.actor)}</span>{" "}
                <span className="text-muted-foreground">{e.action.replace(".", " · ").replace("_", " ")}</span>{" "}
                <span className="font-medium">{e.entityLabel}</span>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">{dateTime(e.at)}</span>
            </div>
            {(e.before || e.after) && (
              <div className="mt-1 text-[12.5px]">
                {e.before && <span className="text-muted-foreground line-through">{e.before}</span>}
                {e.before && e.after && <span className="mx-1.5 text-muted-foreground">→</span>}
                {e.after && <span className="font-medium text-ink">{e.after}</span>}
              </div>
            )}
            {e.reason && <div className="mt-0.5 text-[12px] italic text-muted-foreground">“{e.reason}”</div>}
            <div className="mt-1 font-mono text-[10.5px] text-muted-foreground/70">
              {e.id} · hash {e.hash} · prev {e.prevHash.slice(0, 8)}…
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
