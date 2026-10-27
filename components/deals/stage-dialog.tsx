"use client";

import * as React from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import type { Deal, Stage } from "@/lib/types";
import { STAGE_LABEL, TRANSITIONS } from "@/lib/data/deals";
import { useApp } from "@/lib/store";
import { can } from "@/lib/data/personas";
import { PERSONA } from "@/lib/data/personas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StagePill } from "@/components/common/ui";

const DEFAULT_REASON: Partial<Record<Stage, string>> = {
  screening: "Core package received; run buy-box screening",
  underwriting: "Fits at least one capital partner; proceed to full underwriting",
  term_sheet: "Sizing approved internally; issue term sheet",
  committee: "Credit memo submitted for committee review",
  approved: "Approved by credit committee",
  declined: "Outside all capital partner buy-boxes",
  dead: "Sponsor withdrew",
  intake: "Reopened",
};

/** Validates a requested transition and returns an error message if blocked. */
export function checkTransition(deal: Deal, to: Stage, personaId: Parameters<typeof can>[0]): string | null {
  if (deal.stage === to) return null;
  if (!can(personaId, "deal.move")) return `${PERSONA[personaId].title} can't move pipeline stages.`;
  if (!TRANSITIONS[deal.stage].includes(to)) {
    return `${STAGE_LABEL[deal.stage]} → ${STAGE_LABEL[to]} isn't an allowed transition. Allowed: ${TRANSITIONS[deal.stage]
      .map((s) => STAGE_LABEL[s])
      .join(", ")}.`;
  }
  if (to === "approved" && !can(personaId, "committee.vote")) return "Only credit committee can approve a deal.";
  return null;
}

export function StageDialog({
  deal,
  to,
  onClose,
}: {
  deal: Deal | null;
  to: Stage | null;
  onClose: () => void;
}) {
  const moveDeal = useApp((s) => s.moveDeal);
  const [reason, setReason] = React.useState("");
  React.useEffect(() => {
    if (to) setReason(DEFAULT_REASON[to] ?? "");
  }, [to]);
  const open = Boolean(deal && to);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Move {deal?.name}</DialogTitle>
          <DialogDescription>Stage changes are append-only and written to the audit trail with your reason.</DialogDescription>
        </DialogHeader>
        {deal && to && (
          <div className="flex items-center justify-center gap-3 rounded-xl bg-muted/60 py-3">
            <StagePill stage={deal.stage} />
            <ArrowRight className="size-4 text-muted-foreground" />
            <StagePill stage={to} />
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Reason (required)</label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1.5 min-h-20" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!reason.trim()}
            onClick={() => {
              if (!deal || !to) return;
              moveDeal(deal.id, to, reason.trim());
              toast.success(`${deal.name} moved to ${STAGE_LABEL[to]}`, { description: "Stage history and audit event recorded." });
              onClose();
            }}
          >
            Confirm move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
