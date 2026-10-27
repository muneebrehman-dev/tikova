// Phase 2+ preview data: funded loans, a construction draw and participations.
// Used to show how the Phase 1 data model extends without a rebuild.

export interface FundedLoan {
  id: string;
  name: string;
  city: string;
  assetType: string;
  product: string;
  commitment: number;
  funded: number;
  rate: string;
  allIn: number;
  fundedOn: string;
  maturity: string;
  status: "Performing" | "Watchlist" | "Paid off";
  covenant: "In compliance" | "Cure period" | "—";
  participations: { partnerId: string; share: number }[];
  drawNo?: number;
  pctComplete?: number;
}

export const FUNDED_LOANS: FundedLoan[] = [
  { id: "L-2601", name: "Fells Point Mixed-Use", city: "Baltimore, MD", assetType: "Mixed-Use", product: "Redevelopment", commitment: 6_000_000, funded: 6_000_000, rate: "S + 5.95%", allIn: 0.1025, fundedOn: "2026-02-12", maturity: "2028-02-12", status: "Performing", covenant: "In compliance", participations: [{ partnerId: "fund1", share: 0.6 }, { partnerId: "meridian", share: 0.25 }, { partnerId: "bayline", share: 0.15 }] },
  { id: "L-2602", name: "Hollins Market Townhomes", city: "Baltimore, MD", assetType: "Multifamily", product: "Ground-Up Construction", commitment: 7_800_000, funded: 4_310_100, rate: "S + 5.50%", allIn: 0.098, fundedOn: "2026-03-20", maturity: "2028-09-20", status: "Performing", covenant: "In compliance", participations: [{ partnerId: "fund1", share: 0.7 }, { partnerId: "bayline", share: 0.3 }], drawNo: 5, pctComplete: 0.58 },
  { id: "L-2603", name: "Mount Vernon Flats", city: "Baltimore, MD", assetType: "Multifamily", product: "Value-Add Bridge", commitment: 4_600_000, funded: 4_210_000, rate: "S + 4.85%", allIn: 0.0915, fundedOn: "2025-11-05", maturity: "2027-11-05", status: "Performing", covenant: "In compliance", participations: [{ partnerId: "fund1", share: 1 }] },
  { id: "L-2604", name: "York Road Retail", city: "Towson, MD", assetType: "Retail", product: "Bridge", commitment: 2_900_000, funded: 2_900_000, rate: "S + 4.75%", allIn: 0.0905, fundedOn: "2025-09-18", maturity: "2027-03-18", status: "Watchlist", covenant: "Cure period", participations: [{ partnerId: "fund1", share: 1 }] },
  { id: "L-2605", name: "Alexandria Self-Storage", city: "Alexandria, VA", assetType: "Self-Storage", product: "Ground-Up Construction", commitment: 6_700_000, funded: 5_920_000, rate: "S + 5.25%", allIn: 0.0955, fundedOn: "2025-08-01", maturity: "2027-08-01", status: "Performing", covenant: "In compliance", participations: [{ partnerId: "fund1", share: 0.65 }, { partnerId: "bayline", share: 0.35 }], drawNo: 11, pctComplete: 0.93 },
  { id: "L-2606", name: "Canton Industrial", city: "Baltimore, MD", assetType: "Industrial", product: "Bridge", commitment: 3_950_000, funded: 0, rate: "S + 4.50%", allIn: 0.088, fundedOn: "2025-04-10", maturity: "2027-04-10", status: "Paid off", covenant: "—", participations: [{ partnerId: "fund1", share: 0.6 }, { partnerId: "atlas", share: 0.4 }] },
];

/* ------------------------- Construction draw -------------------------- */

export interface DrawLine {
  code: string;
  label: string;
  category: "Hard" | "Soft";
  budget: number;
  prior: number;
  requested: number;
  inspectorPct: number; // inspector's % complete for the line after this draw
}

export const DRAW = {
  loanId: "L-2602",
  loanName: "Hollins Market Townhomes",
  number: 5,
  submittedOn: "2026-10-21",
  period: "Sep 21 – Oct 20, 2026",
  inspector: "Ridgeline Construction Consultants",
  inspectionDate: "2026-10-24",
  retainagePct: 0.1,
  interestReserveBudget: 520_000,
  lines: [
    { code: "01", label: "Sitework & utilities", category: "Hard", budget: 640_000, prior: 640_000, requested: 0, inspectorPct: 1 },
    { code: "02", label: "Foundations", category: "Hard", budget: 520_000, prior: 520_000, requested: 0, inspectorPct: 1 },
    { code: "03", label: "Framing & carpentry", category: "Hard", budget: 1_380_000, prior: 1_035_000, requested: 276_000, inspectorPct: 0.95 },
    { code: "04", label: "Roofing", category: "Hard", budget: 310_000, prior: 155_000, requested: 124_000, inspectorPct: 0.9 },
    { code: "05", label: "Windows & doors", category: "Hard", budget: 420_000, prior: 168_000, requested: 168_000, inspectorPct: 0.72 },
    { code: "06", label: "MEP rough-in", category: "Hard", budget: 1_240_000, prior: 496_000, requested: 310_000, inspectorPct: 0.65 },
    { code: "07", label: "Drywall & interior finishes", category: "Hard", budget: 1_160_000, prior: 0, requested: 116_000, inspectorPct: 0.1 },
    { code: "08", label: "Exterior cladding", category: "Hard", budget: 540_000, prior: 81_000, requested: 135_000, inspectorPct: 0.4 },
    { code: "09", label: "General conditions & GC fee", category: "Hard", budget: 690_000, prior: 310_500, requested: 69_000, inspectorPct: 0.55 },
    { code: "10", label: "Hard cost contingency", category: "Hard", budget: 345_000, prior: 42_000, requested: 0, inspectorPct: 0 },
    { code: "11", label: "Architecture & engineering", category: "Soft", budget: 380_000, prior: 342_000, requested: 19_000, inspectorPct: 0.95 },
    { code: "12", label: "Permits & impact fees", category: "Soft", budget: 210_000, prior: 210_000, requested: 0, inspectorPct: 1 },
    { code: "13", label: "Interest reserve", category: "Soft", budget: 520_000, prior: 214_600, requested: 61_450, inspectorPct: 0.53 },
    { code: "14", label: "Insurance & taxes", category: "Soft", budget: 160_000, prior: 96_000, requested: 16_000, inspectorPct: 0.7 },
  ] as DrawLine[],
  aiChecks: [
    { status: "pass" as const, text: "G702/G703 application totals tie to the line-item request ($1,294,450)." },
    { status: "pass" as const, text: "14 of 15 subcontractor invoices matched to requested line amounts." },
    { status: "warn" as const, text: "Conditional lien waiver missing for framing subcontractor (Line 03, $276,000)." },
    { status: "warn" as const, text: "Line 05 request implies 80% complete; inspector reports 72% — over-request of $33,600." },
    { status: "pass" as const, text: "Retainage at 10% applied to hard-cost lines only." },
    { status: "pass" as const, text: "Interest reserve draw equals accrued interest for the period (Act/360)." },
  ],
};

export function drawMath() {
  const rows = DRAW.lines.map((l) => {
    const supportedToDate = l.budget * l.inspectorPct;
    // fundable this draw = lesser of request and inspector-supported progress, net of prior
    const fundable = l.category === "Hard" ? Math.max(0, Math.min(l.requested, supportedToDate - l.prior)) : l.requested;
    const retainage = l.category === "Hard" ? fundable * DRAW.retainagePct : 0;
    return { ...l, fundable, retainage, net: fundable - retainage, balanceToFinish: l.budget - l.prior - l.requested };
  });
  const sum = (k: "budget" | "prior" | "requested" | "fundable" | "retainage" | "net" | "balanceToFinish") =>
    rows.reduce((a, r) => a + r[k], 0);
  return {
    rows,
    budget: sum("budget"),
    prior: sum("prior"),
    requested: sum("requested"),
    fundable: sum("fundable"),
    retainage: sum("retainage"),
    net: sum("net"),
    balanceToFinish: sum("balanceToFinish"),
    adjustment: sum("requested") - sum("fundable"),
  };
}
