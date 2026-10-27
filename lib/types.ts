// Domain types for the Tikova prototype. Shapes mirror the proposed Phase 1
// data model (Deal, CapitalPartner, BuyBox, Document, ExtractedField, Evidence,
// UnderwritingRun, AuditEvent) so the prototype doubles as a model walkthrough.

export type Stage =
  | "intake"
  | "screening"
  | "underwriting"
  | "term_sheet"
  | "committee"
  | "approved"
  | "declined"
  | "dead";

export type AssetType =
  | "Multifamily"
  | "Industrial"
  | "Retail"
  | "Mixed-Use"
  | "Hospitality"
  | "Self-Storage"
  | "Entertainment"
  | "Medical Office";

export type ProductType =
  | "Ground-Up Construction"
  | "Value-Add Bridge"
  | "Bridge"
  | "Redevelopment";

export type Recourse = "Full recourse" | "Partial recourse" | "Non-recourse";

export type PersonaId =
  | "ceo"
  | "partner"
  | "capital_markets"
  | "senior_analyst"
  | "analyst"
  | "construction"
  | "closing"
  | "cfo"
  | "investor_relations"
  | "it_admin";

export interface Persona {
  id: PersonaId;
  title: string;
  initials: string;
  group: string;
  color: string;
  blurb: string;
}

export interface Sponsor {
  id: string;
  name: string;
  principal: string;
  hq: string;
  founded: number;
  netWorth: number;
  liquidity: number;
  pfsDate: string;
  unitsDelivered: number;
  activeProjects: number;
  focus: string[];
  rating: "A" | "B+" | "B" | "C";
}

export interface Broker {
  id: string;
  firm: string;
  contact: string;
  title: string;
  city: string;
  dealsSourced: number;
  dealsClosed: number;
}

export interface Note {
  id: string;
  at: string;
  by: PersonaId;
  text: string;
}

export interface StageEvent {
  id: string;
  at: string;
  by: PersonaId;
  from: Stage | null;
  to: Stage;
  reason: string;
}

export interface Deal {
  id: string;
  code: string;
  name: string;
  stage: Stage;
  assetType: AssetType;
  productType: ProductType;
  purpose: "Acquisition" | "Refinance" | "Construction" | "Recapitalization";
  address: string;
  city: string;
  state: string;
  submarket: string;
  units?: number;
  sqft?: number;
  yearBuilt?: number;
  sponsorId: string;
  brokerId: string;
  borrowerEntity: string;
  loanAmount: number;
  initialAdvance?: number;
  futureFunding?: number;
  totalCost: number;
  asIsValue?: number;
  stabilizedValue: number;
  stabilizedNoi: number;
  inPlaceNoi?: number;
  recourse: Recourse;
  spreadBps: number;
  termMonths: number;
  owner: PersonaId;
  createdAt: string;
  stageEnteredAt: string;
  targetClose?: string;
  docsApproved: number;
  docsTotal: number;
  openFlags: number;
  hasPhaseOneEsa: boolean;
  hasGmpContract: boolean;
  closeReason?: string;
  tags: string[];
  notes: Note[];
  history: StageEvent[];
}

export type RuleKind = "hard" | "soft" | "required";

export type MetricKey =
  | "assetType"
  | "productType"
  | "state"
  | "loanAmount"
  | "ltc"
  | "ltv"
  | "dscr"
  | "debtYield"
  | "liquidityRatio"
  | "netWorthRatio"
  | "recourse"
  | "phaseOneEsa"
  | "gmpContract";

export interface BuyBoxRule {
  id: string;
  label: string;
  kind: RuleKind;
  metric: MetricKey;
  op: "in" | "lte" | "gte" | "between" | "present" | "eq";
  value: number | string | string[] | [number, number] | boolean;
  appliesTo?: ProductType[];
}

export interface BuyBoxVersion {
  version: number;
  effectiveFrom: string;
  publishedBy: PersonaId;
  changeNote: string;
  rules: BuyBoxRule[];
}

export interface CapitalPartner {
  id: string;
  name: string;
  short: string;
  type: "Debt Fund" | "SMA" | "Participant";
  commitment: number;
  deployed: number;
  reserved: number;
  loans: number;
  maxHoldPct: number;
  coupon: string;
  color: string;
  description: string;
  buyBox: BuyBoxVersion[];
}

export type RuleOutcome = "pass" | "fail" | "missing";
export type ScreenStatus = "pass" | "soft_miss" | "hard_fail" | "incomplete";

export interface RuleResult {
  rule: BuyBoxRule;
  outcome: RuleOutcome;
  actual: string;
  expected: string;
  reason: string;
}

export interface ScreeningResult {
  partnerId: string;
  version: number;
  status: ScreenStatus;
  results: RuleResult[];
}

export type DocClass =
  | "rent_roll"
  | "t12"
  | "budget"
  | "appraisal"
  | "pfs"
  | "psa"
  | "om"
  | "esa";

export type DocStatus =
  | "missing"
  | "stored"
  | "ready"
  | "processing"
  | "needs_review"
  | "approved";

export type FieldStatus = "extracted" | "needs_review" | "approved" | "rejected";

export interface Evidence {
  page: number;
  anchor: string;
  quote: string;
}

export interface ExtractedField {
  id: string;
  label: string;
  group: string;
  value: number | string;
  format: "money" | "pct" | "date" | "text" | "int" | "x";
  critical: boolean;
  confidence: "high" | "medium" | "low";
  status: FieldStatus;
  evidence: Evidence;
  note?: string;
  originalValue?: number | string;
  editedBy?: PersonaId;
  approvedBy?: PersonaId;
}

export interface ValidationCheck {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export interface DealDocument {
  id: string;
  dealId: string;
  docClass: DocClass;
  title: string;
  fileName: string;
  format: "xlsx" | "pdf" | "pdf-scan";
  pages: number;
  sizeKb: number;
  sha256: string;
  uploadedAt: string;
  uploadedBy: PersonaId;
  version: number;
  status: DocStatus;
  extractable: boolean;
  route?: string;
  run?: {
    id: string;
    model: string;
    promptVersion: string;
    schemaVersion: string;
    startedAt: string;
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
  fields: ExtractedField[];
  validations: ValidationCheck[];
  piiRedactions?: string[];
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: PersonaId | "system" | "claude";
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  field?: string;
  before?: string;
  after?: string;
  reason?: string;
  requestId: string;
  prevHash: string;
  hash: string;
}

export interface UnderwritingRun {
  id: string;
  dealId: string;
  number: number;
  label: string;
  at: string;
  by: PersonaId;
  formulaVersion: string;
  inputsHash: string;
  policyId: string;
  inputs: SizingInputs;
  outputs: SizingOutputs;
}

export interface SizingPolicy {
  id: string;
  label: string;
  maxLtc: number;
  maxLtv: number;
  minDscr: number;
  minDebtYield: number;
}

export interface SizingInputs {
  requestedLoan: number;
  totalCost: number;
  value: number;
  valueBasis: string;
  noi: number;
  noiBasis: string;
  takeoutRate: number;
  amortYears: number;
  policy: SizingPolicy;
}

export interface ConstraintResult {
  key: "ltc" | "ltv" | "dscr" | "debtYield";
  label: string;
  maxLoan: number;
  actual: number;
  threshold: number;
  passes: boolean;
}

export interface SizingOutputs {
  ltc: number;
  ltv: number;
  dscr: number;
  debtYield: number;
  annualDebtService: number;
  loanConstant: number;
  constraints: ConstraintResult[];
  maxLoan: number;
  binding: ConstraintResult["key"];
  headroom: number;
}
