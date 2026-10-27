import type { Persona, PersonaId } from "@/lib/types";

// Role titles mirror Tikova's team structure. No real names are used.
export const PERSONAS: Persona[] = [
  { id: "senior_analyst", title: "Senior Analyst", initials: "SA", group: "Underwriting", color: "#0d0d0e", blurb: "Runs extraction review, sizing and the credit memo." },
  { id: "ceo", title: "Founder & CEO", initials: "FC", group: "Credit Committee", color: "#b87518", blurb: "Chairs credit committee; approves exceptions." },
  { id: "partner", title: "Partner", initials: "PT", group: "Credit Committee", color: "#7c5c2e", blurb: "Credit committee voting member." },
  { id: "capital_markets", title: "Capital Markets Advisor", initials: "CM", group: "Origination", color: "#2f6fb3", blurb: "Owns intake, broker relationships and partner buy-boxes." },
  { id: "analyst", title: "Analyst", initials: "AN", group: "Underwriting", color: "#52525b", blurb: "Spreads documents; critical fields need senior approval." },
  { id: "construction", title: "Director of Construction", initials: "DC", group: "Asset Management", color: "#0f8a5f", blurb: "Budgets, inspections and construction draws." },
  { id: "closing", title: "Loan Closing", initials: "LC", group: "Transactions", color: "#6d4fb3", blurb: "Term sheets, closing checklists and signatures." },
  { id: "cfo", title: "CFO", initials: "CF", group: "Finance", color: "#9a3b3b", blurb: "Ledger, allocations and committee vote." },
  { id: "investor_relations", title: "Investor Relations", initials: "IR", group: "Investor Relations", color: "#0e7490", blurb: "Partner reporting (read-only on deals)." },
  { id: "it_admin", title: "IT Administrator", initials: "IT", group: "Administration", color: "#3f3f46", blurb: "Users, roles, SSO and audit access." },
];

export const PERSONA: Record<PersonaId, Persona> = Object.fromEntries(
  PERSONAS.map((p) => [p.id, p]),
) as Record<PersonaId, Persona>;

export type Permission =
  | "deal.create"
  | "deal.move"
  | "doc.upload"
  | "extract.run"
  | "field.approve"
  | "field.approve_critical"
  | "sizing.run"
  | "memo.edit"
  | "committee.vote"
  | "exception.approve"
  | "buybox.manage"
  | "termsheet.edit"
  | "draw.approve"
  | "users.manage"
  | "audit.view";

export const PERMISSION_LABELS: Record<Permission, string> = {
  "deal.create": "Create deals",
  "deal.move": "Move pipeline stage",
  "doc.upload": "Upload documents",
  "extract.run": "Run AI extraction",
  "field.approve": "Approve extracted fields",
  "field.approve_critical": "Approve critical fields",
  "sizing.run": "Run & save sizing",
  "memo.edit": "Edit credit memo",
  "committee.vote": "Vote in credit committee",
  "exception.approve": "Approve policy exceptions",
  "buybox.manage": "Manage buy-boxes",
  "termsheet.edit": "Edit term sheets",
  "draw.approve": "Approve construction draws",
  "users.manage": "Manage users & roles",
  "audit.view": "View audit trail",
};

const ALL = Object.keys(PERMISSION_LABELS) as Permission[];

export const ROLE_PERMISSIONS: Record<PersonaId, Permission[]> = {
  ceo: ALL.filter((p) => p !== "users.manage"),
  partner: ["deal.move", "committee.vote", "exception.approve", "audit.view", "memo.edit"],
  capital_markets: ["deal.create", "deal.move", "doc.upload", "buybox.manage", "termsheet.edit", "audit.view"],
  senior_analyst: [
    "deal.create",
    "deal.move",
    "doc.upload",
    "extract.run",
    "field.approve",
    "field.approve_critical",
    "sizing.run",
    "memo.edit",
    "termsheet.edit",
    "audit.view",
  ],
  analyst: ["doc.upload", "extract.run", "field.approve", "sizing.run", "memo.edit"],
  construction: ["doc.upload", "draw.approve", "audit.view"],
  closing: ["deal.move", "doc.upload", "termsheet.edit"],
  cfo: ["committee.vote", "audit.view"],
  investor_relations: [],
  it_admin: ["users.manage", "audit.view"],
};

export function can(persona: PersonaId, perm: Permission): boolean {
  return ROLE_PERMISSIONS[persona].includes(perm);
}

export const COMMITTEE_VOTERS: PersonaId[] = ["ceo", "partner", "cfo"];
