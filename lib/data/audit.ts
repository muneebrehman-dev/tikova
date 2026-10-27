import type { AuditEvent } from "@/lib/types";
import { hash16 } from "@/lib/engine/hash";

export type AuditSeed = Omit<AuditEvent, "id" | "prevHash" | "hash" | "requestId">;

export const GENESIS = "0000000000000000";

export function eventHash(e: Omit<AuditEvent, "hash">): string {
  return hash16(
    [e.prevHash, e.id, e.at, e.actor, e.action, e.entityType, e.entityId, e.field ?? "", e.before ?? "", e.after ?? "", e.reason ?? ""].join("|"),
  );
}

export function chain(seeds: AuditSeed[], startIndex = 1, prev = GENESIS): AuditEvent[] {
  const out: AuditEvent[] = [];
  seeds.forEach((s, i) => {
    const id = `evt_${(startIndex + i).toString().padStart(5, "0")}`;
    const base = { ...s, id, requestId: `req_${hash16(id).slice(0, 10)}`, prevHash: prev };
    const hash = eventHash(base);
    out.push({ ...base, hash });
    prev = hash;
  });
  return out;
}

export function verifyChain(events: AuditEvent[]): { ok: boolean; brokenAt?: string } {
  let prev = GENESIS;
  for (const e of events) {
    if (e.prevHash !== prev) return { ok: false, brokenAt: e.id };
    const { hash, ...rest } = e;
    if (eventHash(rest) !== hash) return { ok: false, brokenAt: e.id };
    prev = hash;
  }
  return { ok: true };
}

const seeds: AuditSeed[] = [
  { at: "2026-09-22T14:10:00.000Z", actor: "capital_markets", action: "deal.created", entityType: "Deal", entityId: "harborview", entityLabel: "Harborview Lofts", after: "Intake · $8,450,000 request" },
  { at: "2026-09-22T14:12:00.000Z", actor: "capital_markets", action: "document.uploaded", entityType: "Document", entityId: "hv-om", entityLabel: "Harborview_OM_Northbay.pdf", after: "v1 · sha256 verified" },
  { at: "2026-09-25T16:42:00.000Z", actor: "capital_markets", action: "document.uploaded", entityType: "Document", entityId: "hv-rentroll", entityLabel: "Harborview_RentRoll_2026-09-30.xlsx", after: "v2 (supersedes v1)" },
  { at: "2026-09-25T16:43:13.000Z", actor: "claude", action: "extraction.completed", entityType: "ExtractionRun", entityId: "run_8f21", entityLabel: "Rent roll · header mapping", after: "8 fields · schema RentRoll@3.2.0" },
  { at: "2026-09-25T16:45:12.000Z", actor: "claude", action: "extraction.completed", entityType: "ExtractionRun", entityId: "run_8f2c", entityLabel: "T-12 operating statement", after: "7 fields · 1 reclassification flagged" },
  { at: "2026-09-25T17:00:00.000Z", actor: "capital_markets", action: "deal.stage_changed", entityType: "Deal", entityId: "harborview", entityLabel: "Harborview Lofts", field: "stage", before: "Intake", after: "Screening", reason: "Core package received (OM, rent roll, T-12)" },
  { at: "2026-09-25T17:00:01.000Z", actor: "system", action: "buybox.screened", entityType: "BuyboxResult", entityId: "harborview", entityLabel: "Harborview Lofts", after: "Fund I pass · Bayline soft miss · Atlas incomplete · Meridian hard fail" },
  { at: "2026-09-29T15:21:00.000Z", actor: "senior_analyst", action: "field.approved", entityType: "ExtractedField", entityId: "rr-units", entityLabel: "Rent roll · Total units", after: "64" },
  { at: "2026-09-29T15:22:00.000Z", actor: "senior_analyst", action: "field.approved", entityType: "ExtractedField", entityId: "rr-contract", entityLabel: "Rent roll · Monthly in-place rent", after: "$77,825" },
  { at: "2026-10-01T13:05:00.000Z", actor: "capital_markets", action: "buybox.version_published", entityType: "BuyBox", entityId: "fund1", entityLabel: "Tikova Credit Fund I", field: "max_ltv", before: "72.5%", after: "75.0%", reason: "Effective 2026-07-01 per IC memo" },
  { at: "2026-10-08T14:12:00.000Z", actor: "senior_analyst", action: "document.uploaded", entityType: "Document", entityId: "hv-budget", entityLabel: "Harborview_CapEx_Budget_v3.pdf", after: "v3 (supersedes v2)" },
  { at: "2026-10-08T14:20:00.000Z", actor: "senior_analyst", action: "field.approved", entityType: "ExtractedField", entityId: "bud-total", entityLabel: "Budget · Total renovation budget", after: "$1,500,000" },
  { at: "2026-10-09T16:30:00.000Z", actor: "senior_analyst", action: "deal.stage_changed", entityType: "Deal", entityId: "harborview", entityLabel: "Harborview Lofts", field: "stage", before: "Screening", after: "Underwriting", reason: "Fund I pass; Bayline soft miss — proceed to full underwriting" },
  { at: "2026-10-15T14:00:00.000Z", actor: "senior_analyst", action: "document.requested", entityType: "Document", entityId: "hv-esa", entityLabel: "Phase I ESA", after: "Requested from sponsor" },
  { at: "2026-10-16T14:00:00.000Z", actor: "senior_analyst", action: "deal.stage_changed", entityType: "Deal", entityId: "silverspring", entityLabel: "Silver Spring Station Retail", field: "stage", before: "Underwriting", after: "Term Sheet", reason: "Sized at $5.40MM; term sheet v1 issued" },
  { at: "2026-10-19T15:30:00.000Z", actor: "senior_analyst", action: "deal.stage_changed", entityType: "Deal", entityId: "towson", entityLabel: "Towson Garden Apartments", field: "stage", before: "Underwriting", after: "Term Sheet" },
  { at: "2026-10-20T19:15:00.000Z", actor: "capital_markets", action: "deal.stage_changed", entityType: "Deal", entityId: "locustpoint", entityLabel: "Locust Point Flex Center", field: "stage", before: "Intake", after: "Screening" },
  { at: "2026-10-21T13:40:00.000Z", actor: "capital_markets", action: "note.added", entityType: "Deal", entityId: "harborview", entityLabel: "Harborview Lofts", after: "Bayline participation appetite ~30%" },
  { at: "2026-10-22T21:00:00.000Z", actor: "ceo", action: "committee.decision", entityType: "Deal", entityId: "hampden", entityLabel: "Hampden Retail Row", before: "Credit Committee", after: "Approved", reason: "Approved 3–0; standard conditions" },
  { at: "2026-10-23T20:00:00.000Z", actor: "senior_analyst", action: "deal.stage_changed", entityType: "Deal", entityId: "arlington", entityLabel: "Arlington Yards Townhomes", field: "stage", before: "Term Sheet", after: "Credit Committee", reason: "Memo v4 submitted" },
  { at: "2026-10-24T14:10:00.000Z", actor: "partner", action: "committee.vote", entityType: "Deal", entityId: "arlington", entityLabel: "Arlington Yards Townhomes", after: "Approve with conditions", reason: "Require GMP bond + 10% completion guaranty" },
  { at: "2026-10-24T17:51:00.000Z", actor: "senior_analyst", action: "document.uploaded", entityType: "Document", entityId: "hv-appraisal", entityLabel: "Harborview_Appraisal_Brightline_2026-10.pdf", after: "v1 · 142 pages" },
  { at: "2026-10-24T17:53:12.000Z", actor: "claude", action: "extraction.completed", entityType: "ExtractionRun", entityId: "run_93d7", entityLabel: "Appraisal · 5 sections", after: "11 fields · 1 cross-document flag" },
  { at: "2026-10-24T18:05:00.000Z", actor: "senior_analyst", action: "note.added", entityType: "Deal", entityId: "harborview", entityLabel: "Harborview Lofts", after: "Appraisal received; reviewing 2BR rent conclusion" },
  { at: "2026-10-26T14:45:00.000Z", actor: "capital_markets", action: "deal.created", entityType: "Deal", entityId: "columbia", entityLabel: "Columbia Medical Pavilion", after: "Intake · $3,200,000 request" },
  { at: "2026-10-26T15:05:00.000Z", actor: "capital_markets", action: "document.uploaded", entityType: "Document", entityId: "hv-pfs", entityLabel: "Calloway_PFS_REO_2026-03-31_scan.pdf", after: "v1 · scanned · PII scan queued" },
  { at: "2026-10-26T15:05:04.000Z", actor: "system", action: "pii.redacted", entityType: "Document", entityId: "hv-pfs", entityLabel: "Calloway_PFS_REO_2026-03-31_scan.pdf", after: "SSN + 2 account numbers redacted" },
  { at: "2026-10-27T13:10:00.000Z", actor: "capital_markets", action: "deal.created", entityType: "Deal", entityId: "annapolis", entityLabel: "Annapolis Marina Village", after: "Intake · $8,100,000 request" },
  { at: "2026-10-27T14:31:00.000Z", actor: "it_admin", action: "role.assigned", entityType: "User", entityId: "usr_analyst2", entityLabel: "Analyst (new hire)", field: "role", before: "Read-only", after: "Analyst", reason: "Onboarding approved by CFO" },
];

export const AUDIT_SEED: AuditEvent[] = chain(seeds);
