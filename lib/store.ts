"use client";

import { create } from "zustand";
import type {
  AuditEvent,
  Deal,
  DealDocument,
  ExtractedField,
  PersonaId,
  Stage,
  UnderwritingRun,
} from "@/lib/types";
import { DEALS, STAGE_LABEL } from "@/lib/data/deals";
import { DOCUMENTS } from "@/lib/data/documents";
import { AUDIT_SEED, chain, type AuditSeed } from "@/lib/data/audit";
import { DEMO_TODAY, formatValue } from "@/lib/format";

export type VoteDecision = "approve" | "approve_conditions" | "decline" | "abstain";
export interface Vote {
  decision: VoteDecision;
  note: string;
  at: string;
}

// Demo clock: actions taken in the browser are stamped relative to the fixed
// demo "today" so relative times read naturally ("just now").
const SESSION_START = typeof window !== "undefined" ? Date.now() : 0;
export function nowIso(): string {
  return new Date(new Date(DEMO_TODAY).getTime() + (Date.now() - SESSION_START)).toISOString();
}

const INITIAL_VOTES: Record<string, Partial<Record<PersonaId, Vote>>> = {
  arlington: {
    partner: {
      decision: "approve_conditions",
      note: "Require GMP payment & performance bond and a 10% completion guaranty.",
      at: "2026-10-24T14:10:00.000Z",
    },
  },
};

interface State {
  persona: PersonaId;
  deals: Deal[];
  documents: DealDocument[];
  audit: AuditEvent[];
  runs: UnderwritingRun[];
  votes: Record<string, Partial<Record<PersonaId, Vote>>>;
  memoEdits: Record<string, string>;
  memoSubmitted: Record<string, boolean>;
  drawStatus: "review" | "approved" | "returned";
  readNotifications: string[];

  setPersona: (p: PersonaId) => void;
  log: (e: AuditSeed) => void;
  moveDeal: (dealId: string, to: Stage, reason: string) => void;
  addNote: (dealId: string, text: string) => void;
  createDeal: (d: Deal) => void;
  approveField: (docId: string, fieldId: string) => void;
  rejectField: (docId: string, fieldId: string, reason: string) => void;
  editField: (docId: string, fieldId: string, value: number | string, reason: string) => void;
  approveAllNonCritical: (docId: string) => void;
  startExtraction: (docId: string) => void;
  finishExtraction: (docId: string) => void;
  uploadDocument: (doc: DealDocument) => void;
  saveRun: (run: UnderwritingRun) => void;
  castVote: (dealId: string, vote: Vote) => void;
  editMemo: (key: string, text: string) => void;
  submitMemo: (dealId: string) => void;
  setDrawStatus: (s: State["drawStatus"], reason: string) => void;
  markNotificationsRead: (ids: string[]) => void;
  reset: () => void;
}

function initial() {
  return {
    persona: "senior_analyst" as PersonaId,
    deals: DEALS.map((d) => ({ ...d, notes: [...d.notes], history: [...d.history] })),
    documents: DOCUMENTS.map((d) => ({ ...d, fields: d.fields.map((f) => ({ ...f })) })),
    audit: AUDIT_SEED,
    runs: [] as UnderwritingRun[],
    votes: JSON.parse(JSON.stringify(INITIAL_VOTES)) as State["votes"],
    memoEdits: {} as Record<string, string>,
    memoSubmitted: {} as Record<string, boolean>,
    drawStatus: "review" as const,
    readNotifications: [] as string[],
  };
}

function updateField(
  docs: DealDocument[],
  docId: string,
  fieldId: string,
  fn: (f: ExtractedField) => ExtractedField,
): DealDocument[] {
  return docs.map((d) => {
    if (d.id !== docId) return d;
    const fields = d.fields.map((f) => (f.id === fieldId ? fn(f) : f));
    const allApproved = fields.length > 0 && fields.every((f) => f.status === "approved");
    return { ...d, fields, status: allApproved ? "approved" : d.status === "approved" ? "needs_review" : d.status };
  });
}

export const useApp = create<State>((set, get) => ({
  ...initial(),

  setPersona: (p) => {
    const prev = get().persona;
    if (prev === p) return;
    set({ persona: p });
  },

  log: (e) =>
    set((s) => {
      const last = s.audit[s.audit.length - 1];
      const [evt] = chain([e], s.audit.length + 1, last?.hash);
      return { audit: [...s.audit, evt] };
    }),

  moveDeal: (dealId, to, reason) => {
    const s = get();
    const deal = s.deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === to) return;
    const at = nowIso();
    set({
      deals: s.deals.map((d) =>
        d.id === dealId
          ? {
              ...d,
              stage: to,
              stageEnteredAt: at,
              history: [...d.history, { id: `h-${at}`, at, by: s.persona, from: d.stage, to, reason }],
            }
          : d,
      ),
    });
    get().log({
      at,
      actor: s.persona,
      action: "deal.stage_changed",
      entityType: "Deal",
      entityId: dealId,
      entityLabel: deal.name,
      field: "stage",
      before: STAGE_LABEL[deal.stage],
      after: STAGE_LABEL[to],
      reason,
    });
  },

  addNote: (dealId, text) => {
    const s = get();
    const at = nowIso();
    const deal = s.deals.find((d) => d.id === dealId);
    set({
      deals: s.deals.map((d) =>
        d.id === dealId ? { ...d, notes: [{ id: `n-${at}`, at, by: s.persona, text }, ...d.notes] } : d,
      ),
    });
    get().log({ at, actor: s.persona, action: "note.added", entityType: "Deal", entityId: dealId, entityLabel: deal?.name ?? dealId, after: text.slice(0, 80) });
  },

  createDeal: (d) => {
    const s = get();
    set({ deals: [d, ...s.deals] });
    get().log({ at: d.createdAt, actor: s.persona, action: "deal.created", entityType: "Deal", entityId: d.id, entityLabel: d.name, after: `Intake · ${formatValue(d.loanAmount, "money")} request` });
  },

  approveField: (docId, fieldId) => {
    const s = get();
    const doc = s.documents.find((d) => d.id === docId);
    const field = doc?.fields.find((f) => f.id === fieldId);
    if (!doc || !field) return;
    set({ documents: updateField(s.documents, docId, fieldId, (f) => ({ ...f, status: "approved", approvedBy: s.persona })) });
    get().log({ at: nowIso(), actor: s.persona, action: "field.approved", entityType: "ExtractedField", entityId: fieldId, entityLabel: `${doc.title.split(" —")[0]} · ${field.label}`, after: formatValue(field.value, field.format) });
  },

  rejectField: (docId, fieldId, reason) => {
    const s = get();
    const doc = s.documents.find((d) => d.id === docId);
    const field = doc?.fields.find((f) => f.id === fieldId);
    if (!doc || !field) return;
    set({ documents: updateField(s.documents, docId, fieldId, (f) => ({ ...f, status: "rejected" })) });
    get().log({ at: nowIso(), actor: s.persona, action: "field.rejected", entityType: "ExtractedField", entityId: fieldId, entityLabel: `${doc.title.split(" —")[0]} · ${field.label}`, before: formatValue(field.value, field.format), reason });
  },

  editField: (docId, fieldId, value, reason) => {
    const s = get();
    const doc = s.documents.find((d) => d.id === docId);
    const field = doc?.fields.find((f) => f.id === fieldId);
    if (!doc || !field) return;
    set({
      documents: updateField(s.documents, docId, fieldId, (f) => ({
        ...f,
        originalValue: f.originalValue ?? f.value,
        value,
        status: "approved",
        editedBy: s.persona,
        approvedBy: s.persona,
      })),
    });
    get().log({ at: nowIso(), actor: s.persona, action: "field.edited", entityType: "ExtractedField", entityId: fieldId, entityLabel: `${doc.title.split(" —")[0]} · ${field.label}`, field: field.label, before: formatValue(field.value, field.format), after: formatValue(value, field.format), reason });
  },

  approveAllNonCritical: (docId) => {
    const s = get();
    const doc = s.documents.find((d) => d.id === docId);
    if (!doc) return;
    const targets = doc.fields.filter((f) => !f.critical && f.status !== "approved" && f.status !== "rejected");
    if (!targets.length) return;
    let docs = s.documents;
    targets.forEach((t) => {
      docs = updateField(docs, docId, t.id, (f) => ({ ...f, status: "approved", approvedBy: s.persona }));
    });
    set({ documents: docs });
    get().log({ at: nowIso(), actor: s.persona, action: "field.bulk_approved", entityType: "Document", entityId: docId, entityLabel: doc.title, after: `${targets.length} non-critical fields` });
  },

  startExtraction: (docId) =>
    set((s) => ({ documents: s.documents.map((d) => (d.id === docId ? { ...d, status: "processing" } : d)) })),

  finishExtraction: (docId) => {
    const s = get();
    const doc = s.documents.find((d) => d.id === docId);
    if (!doc) return;
    const at = nowIso();
    set({
      documents: s.documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: "needs_review",
              run: {
                id: `run_${at.slice(-8, -5).replace(/\D/g, "")}e1`,
                model: "claude-sonnet-5-5",
                promptVersion: "pfs-reo.v3",
                schemaVersion: "SponsorFinancials@2.1.0",
                startedAt: at,
                latencyMs: 18_420,
                inputTokens: 9_870,
                outputTokens: 1_390,
                costUsd: 0.05,
              },
            }
          : d,
      ),
    });
    get().log({ at, actor: "claude", action: "extraction.completed", entityType: "ExtractionRun", entityId: docId, entityLabel: doc.title, after: `${doc.fields.length} fields · ${doc.validations.filter((v) => v.status !== "pass").length} warnings` });
  },

  uploadDocument: (doc) => {
    const s = get();
    set({
      documents: [...s.documents.filter((d) => !(d.dealId === doc.dealId && d.docClass === doc.docClass && d.status === "missing")), doc],
      deals:
        doc.docClass === "esa"
          ? s.deals.map((d) => (d.id === doc.dealId ? { ...d, hasPhaseOneEsa: true } : d))
          : s.deals,
    });
    get().log({ at: doc.uploadedAt, actor: s.persona, action: "document.uploaded", entityType: "Document", entityId: doc.id, entityLabel: doc.fileName, after: `v${doc.version} · sha256 ${doc.sha256.slice(0, 12)}…` });
  },

  saveRun: (run) => {
    const s = get();
    set({ runs: [...s.runs, run] });
    get().log({ at: run.at, actor: s.persona, action: "underwriting.run_saved", entityType: "UnderwritingRun", entityId: run.id, entityLabel: `UW Run #${run.number} · ${run.label}`, after: `Max loan ${formatValue(Math.round(run.outputs.maxLoan), "money")} · binding ${run.outputs.binding.toUpperCase()}` });
  },

  castVote: (dealId, vote) => {
    const s = get();
    const deal = s.deals.find((d) => d.id === dealId);
    set({ votes: { ...s.votes, [dealId]: { ...(s.votes[dealId] ?? {}), [s.persona]: vote } } });
    get().log({ at: vote.at, actor: s.persona, action: "committee.vote", entityType: "Deal", entityId: dealId, entityLabel: deal?.name ?? dealId, after: vote.decision.replace("_", " "), reason: vote.note || undefined });
  },

  editMemo: (key, text) => set((s) => ({ memoEdits: { ...s.memoEdits, [key]: text } })),

  submitMemo: (dealId) => {
    const s = get();
    set({ memoSubmitted: { ...s.memoSubmitted, [dealId]: true } });
    const deal = s.deals.find((d) => d.id === dealId);
    get().log({ at: nowIso(), actor: s.persona, action: "memo.submitted", entityType: "CreditMemoVersion", entityId: dealId, entityLabel: `${deal?.name} · Credit memo`, after: "Submitted to credit committee" });
  },

  setDrawStatus: (st, reason) => {
    const s = get();
    set({ drawStatus: st });
    get().log({ at: nowIso(), actor: s.persona, action: st === "approved" ? "draw.approved" : "draw.returned", entityType: "DrawRequest", entityId: "L-2602-D5", entityLabel: "Hollins Market Townhomes · Draw #5", reason });
  },

  markNotificationsRead: (ids) => set((s) => ({ readNotifications: Array.from(new Set([...s.readNotifications, ...ids])) })),

  reset: () => set(initial()),
}));

/* ----------------------------- selectors ------------------------------ */

export function useDeal(id: string | undefined) {
  return useApp((s) => s.deals.find((d) => d.id === id));
}

export function useDealDocs(id: string | undefined) {
  const docs = useApp((s) => s.documents);
  return docs.filter((d) => d.dealId === id);
}
