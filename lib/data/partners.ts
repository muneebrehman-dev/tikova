import type { CapitalPartner } from "@/lib/types";

const MID_ATLANTIC = ["MD", "DC", "VA", "PA", "DE", "NC"];

export const PARTNERS: CapitalPartner[] = [
  {
    id: "fund1",
    name: "Tikova Credit Fund I",
    short: "Fund I",
    type: "Debt Fund",
    commitment: 150_000_000,
    deployed: 96_400_000,
    reserved: 14_200_000,
    loans: 17,
    maxHoldPct: 1,
    coupon: "Fund return (pooled)",
    color: "#0d0d0e",
    description:
      "Pooled vehicle; Tikova's primary balance sheet for senior construction and bridge loans across the Mid-Atlantic.",
    buyBox: [
      {
        version: 2,
        effectiveFrom: "2025-11-01",
        publishedBy: "capital_markets",
        changeNote: "Added Entertainment (attraction-anchored) asset class.",
        rules: [],
      },
      {
        version: 3,
        effectiveFrom: "2026-07-01",
        publishedBy: "capital_markets",
        changeNote: "Max LTV raised 72.5% → 75% (as-stabilized); min debt yield held at 8.0%.",
        rules: [
          { id: "f-asset", label: "Asset type", kind: "hard", metric: "assetType", op: "in", value: ["Multifamily", "Industrial", "Retail", "Mixed-Use", "Self-Storage", "Entertainment", "Medical Office"] },
          { id: "f-geo", label: "Geography", kind: "hard", metric: "state", op: "in", value: MID_ATLANTIC },
          { id: "f-size", label: "Loan size", kind: "hard", metric: "loanAmount", op: "between", value: [1_000_000, 10_000_000] },
          { id: "f-ltc", label: "Max loan-to-cost", kind: "hard", metric: "ltc", op: "lte", value: 0.8 },
          { id: "f-ltv", label: "Max loan-to-value (as-stabilized)", kind: "hard", metric: "ltv", op: "lte", value: 0.75 },
          { id: "f-dscr", label: "Min DSCR (take-out test)", kind: "hard", metric: "dscr", op: "gte", value: 1.2 },
          { id: "f-dy", label: "Min debt yield (stabilized)", kind: "hard", metric: "debtYield", op: "gte", value: 0.08 },
          { id: "f-liq", label: "Sponsor liquidity", kind: "soft", metric: "liquidityRatio", op: "gte", value: 0.1 },
          { id: "f-nw", label: "Sponsor net worth", kind: "soft", metric: "netWorthRatio", op: "gte", value: 1 },
        ],
      },
    ],
  },
  {
    id: "meridian",
    name: "Meridian Pension SMA",
    short: "Meridian SMA",
    type: "SMA",
    commitment: 60_000_000,
    deployed: 38_500_000,
    reserved: 4_000_000,
    loans: 8,
    maxHoldPct: 0.5,
    coupon: "8.75% pref. pass-through",
    color: "#2f6fb3",
    description:
      "Institutional pension mandate. Conservative leverage, income-producing focus; ground-up construction only with a GMP contract.",
    buyBox: [
      {
        version: 4,
        effectiveFrom: "2026-05-15",
        publishedBy: "capital_markets",
        changeNote: "Min debt yield 9.5% → 9.0% after Q1 mandate review.",
        rules: [
          { id: "m-asset", label: "Asset type", kind: "hard", metric: "assetType", op: "in", value: ["Multifamily", "Industrial", "Medical Office"] },
          { id: "m-geo", label: "Geography", kind: "hard", metric: "state", op: "in", value: ["MD", "VA", "DC"] },
          { id: "m-size", label: "Loan size", kind: "hard", metric: "loanAmount", op: "between", value: [3_000_000, 10_000_000] },
          { id: "m-ltc", label: "Max loan-to-cost", kind: "hard", metric: "ltc", op: "lte", value: 0.7 },
          { id: "m-ltv", label: "Max loan-to-value (as-stabilized)", kind: "hard", metric: "ltv", op: "lte", value: 0.65 },
          { id: "m-dscr", label: "Min DSCR (take-out test)", kind: "hard", metric: "dscr", op: "gte", value: 1.25 },
          { id: "m-dy", label: "Min debt yield (stabilized)", kind: "hard", metric: "debtYield", op: "gte", value: 0.09 },
          { id: "m-gmp", label: "GMP construction contract", kind: "required", metric: "gmpContract", op: "present", value: true, appliesTo: ["Ground-Up Construction"] },
        ],
      },
    ],
  },
  {
    id: "atlas",
    name: "Atlas Family Office SMA",
    short: "Atlas SMA",
    type: "SMA",
    commitment: 40_000_000,
    deployed: 17_200_000,
    reserved: 2_500_000,
    loans: 6,
    maxHoldPct: 0.4,
    coupon: "9.25% pass-through",
    color: "#0f8a5f",
    description:
      "Single-family-office mandate. Bridge and value-add only — no ground-up construction. Requires environmental clearance before screening completes.",
    buyBox: [
      {
        version: 2,
        effectiveFrom: "2026-03-01",
        publishedBy: "capital_markets",
        changeNote: "Added Phase I ESA as a required document.",
        rules: [
          { id: "a-prod", label: "Product type", kind: "hard", metric: "productType", op: "in", value: ["Value-Add Bridge", "Bridge", "Redevelopment"] },
          { id: "a-size", label: "Loan size", kind: "hard", metric: "loanAmount", op: "between", value: [1_000_000, 10_000_000] },
          { id: "a-ltv", label: "Max loan-to-value (as-stabilized)", kind: "hard", metric: "ltv", op: "lte", value: 0.72 },
          { id: "a-dy", label: "Min debt yield (stabilized)", kind: "hard", metric: "debtYield", op: "gte", value: 0.085 },
          { id: "a-liq", label: "Sponsor liquidity", kind: "hard", metric: "liquidityRatio", op: "gte", value: 0.1 },
          { id: "a-esa", label: "Phase I ESA", kind: "required", metric: "phaseOneEsa", op: "present", value: true },
        ],
      },
    ],
  },
  {
    id: "bayline",
    name: "Bayline Bank",
    short: "Bayline",
    type: "Participant",
    commitment: 35_000_000,
    deployed: 22_900_000,
    reserved: 2_535_000,
    loans: 9,
    maxHoldPct: 0.35,
    coupon: "8.50% pass-through",
    color: "#7c5c2e",
    description:
      "Regional bank participation program. Buys up to 35% of a loan; Tikova remains lead lender and servicer of record.",
    buyBox: [
      {
        version: 3,
        effectiveFrom: "2026-01-10",
        publishedBy: "capital_markets",
        changeNote: "Moved LTV and DSCR to preferences; hard LTC cap kept at 80%.",
        rules: [
          { id: "b-asset", label: "Asset type", kind: "hard", metric: "assetType", op: "in", value: ["Multifamily", "Mixed-Use", "Retail"] },
          { id: "b-geo", label: "Geography", kind: "hard", metric: "state", op: "in", value: ["MD", "PA", "DE", "VA"] },
          { id: "b-size", label: "Loan size", kind: "hard", metric: "loanAmount", op: "between", value: [2_000_000, 10_000_000] },
          { id: "b-ltc", label: "Max loan-to-cost", kind: "hard", metric: "ltc", op: "lte", value: 0.8 },
          { id: "b-ltv", label: "Loan-to-value (as-stabilized)", kind: "soft", metric: "ltv", op: "lte", value: 0.65 },
          { id: "b-dscr", label: "DSCR (take-out test)", kind: "soft", metric: "dscr", op: "gte", value: 1.25 },
          { id: "b-rec", label: "Recourse", kind: "soft", metric: "recourse", op: "eq", value: "Full recourse" },
        ],
      },
    ],
  },
];

// Fill Fund I v2 with the prior thresholds (for version history display).
PARTNERS[0].buyBox[0].rules = PARTNERS[0].buyBox[1].rules.map((r) =>
  r.id === "f-ltv" ? { ...r, value: 0.725 } : r,
);

export const PARTNER: Record<string, CapitalPartner> = Object.fromEntries(
  PARTNERS.map((p) => [p.id, p]),
);
