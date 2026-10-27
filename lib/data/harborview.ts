// Harborview Lofts — the fully worked demo deal. Every number here is
// internally consistent: rent roll -> T-12 -> pro forma -> appraisal ->
// sizing -> credit memo.
import { rng } from "@/lib/engine/hash";

/* ------------------------------------------------------------------ */
/* Rent roll (Excel export, as of 2026-09-30)                          */
/* ------------------------------------------------------------------ */

export type UnitType = "Studio" | "1BR/1BA" | "2BR/2BA";

export interface RentRollRow {
  unit: string;
  type: UnitType;
  sqft: number;
  tenant: string;
  status: "Occupied" | "Vacant" | "Notice";
  leaseStart: string | null;
  leaseEnd: string | null;
  marketRent: number;
  contractRent: number;
  deposit: number;
}

const MARKET: Record<UnitType, number> = { Studio: 1_225, "1BR/1BA": 1_450, "2BR/2BA": 1_795 };
const SQFT: Record<UnitType, number> = { Studio: 520, "1BR/1BA": 720, "2BR/2BA": 1_020 };
const VACANT = new Set(["104", "115", "207", "212", "309", "403", "414"]);
const NOTICE = new Set(["110", "305"]);
const MTM = new Set(["113", "402"]);
const SURNAMES = [
  "Alvarez", "Brooks", "Chen", "Delaney", "Ellis", "Foster", "Garcia", "Hughes", "Ibrahim", "Jensen",
  "Kowalski", "Lopez", "Mitchell", "Nguyen", "Owens", "Patel", "Quinn", "Ramirez", "Sullivan", "Turner",
  "Underwood", "Vance", "Walsh", "Xu", "Young", "Zimmerman", "Abbott", "Bennett", "Carver", "Dunn",
];
const INITIALS = "ABCDEJKLMNRST";

function typeFor(pos: number): UnitType {
  // per floor: positions 1-4 studio, 5-13 one-bed, 14-16 two-bed
  if (pos <= 4) return "Studio";
  if (pos <= 13) return "1BR/1BA";
  return "2BR/2BA";
}

function addMonths(iso: string, m: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + m);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export const RENT_ROLL: RentRollRow[] = (() => {
  const r = rng(41);
  const rows: RentRollRow[] = [];
  let t = 0;
  for (let floor = 1; floor <= 4; floor++) {
    for (let pos = 1; pos <= 16; pos++) {
      const unit = `${floor}${pos.toString().padStart(2, "0")}`;
      const type = typeFor(pos);
      const market = MARKET[type];
      if (VACANT.has(unit)) {
        rows.push({ unit, type, sqft: SQFT[type], tenant: "VACANT", status: "Vacant", leaseStart: null, leaseEnd: null, marketRent: market, contractRent: 0, deposit: 0 });
        continue;
      }
      // in-place rents sit 3%–10% below market (loss-to-lease)
      const ltl = 0.03 + r() * 0.07;
      const contract = Math.round((market * (1 - ltl)) / 5) * 5;
      // 12-month leases starting Oct-2025 .. Sep-2026; two long-tenured month-to-month units
      const monthOffset = 11 + Math.floor(r() * 12);
      const start = MTM.has(unit)
        ? "2024-06-01"
        : new Date(Date.UTC(2024, 10 + monthOffset, 1)).toISOString().slice(0, 10);
      const tenant = `${INITIALS[Math.floor(r() * INITIALS.length)]}. ${SURNAMES[t++ % SURNAMES.length]}`;
      rows.push({
        unit,
        type,
        sqft: SQFT[type],
        tenant,
        status: NOTICE.has(unit) ? "Notice" : "Occupied",
        leaseStart: start,
        leaseEnd: addMonths(start, 12),
        marketRent: market,
        contractRent: contract,
        deposit: contract,
      });
    }
  }
  return rows;
})();

export const RENT_ROLL_SUMMARY = (() => {
  const occupied = RENT_ROLL.filter((u) => u.status !== "Vacant");
  const contract = occupied.reduce((a, u) => a + u.contractRent, 0);
  const market = RENT_ROLL.reduce((a, u) => a + u.marketRent, 0);
  const asOf = "2026-09-30";
  const sixMonths = "2027-03-31";
  const expiring = occupied.filter((u) => u.leaseEnd && u.leaseEnd <= sixMonths).length;
  const mtm = occupied.filter((u) => u.leaseEnd && u.leaseEnd < asOf).length;
  return {
    asOf,
    totalUnits: RENT_ROLL.length,
    occupiedUnits: occupied.length,
    occupancy: occupied.length / RENT_ROLL.length,
    monthlyContractRent: contract,
    annualizedContractRent: contract * 12,
    avgContractRent: contract / occupied.length,
    monthlyMarketRent: market,
    avgMarketRent: market / RENT_ROLL.length,
    lossToLease: 1 - contract / occupied.reduce((a, u) => a + u.marketRent, 0),
    expiringSixMonths: expiring,
    monthToMonth: mtm,
    totalSqft: RENT_ROLL.reduce((a, u) => a + u.sqft, 0),
  };
})();

/* ------------------------------------------------------------------ */
/* T-12 operating statement (Oct-2025 – Sep-2026)                      */
/* ------------------------------------------------------------------ */

export const T12_MONTHS = ["Oct-25", "Nov-25", "Dec-25", "Jan-26", "Feb-26", "Mar-26", "Apr-26", "May-26", "Jun-26", "Jul-26", "Aug-26", "Sep-26"];

export interface T12Line {
  key: string;
  label: string;
  section: "income" | "expense";
  annual: number;
  canonical: string;
  sign: 1 | -1;
  monthly: number[];
  flagged?: boolean;
}

function split(total: number, seed: number, wiggle = 0.06): number[] {
  const r = rng(seed);
  const w = Array.from({ length: 12 }, () => 1 + (r() - 0.5) * 2 * wiggle);
  const sum = w.reduce((a, b) => a + b, 0);
  const out = w.map((x) => Math.round((total * x) / sum));
  out[11] += total - out.reduce((a, b) => a + b, 0);
  return out;
}

const L = (
  key: string,
  label: string,
  section: T12Line["section"],
  annual: number,
  canonical: string,
  sign: 1 | -1,
  seed: number,
  wiggle?: number,
  flagged?: boolean,
): T12Line => ({ key, label, section, annual, canonical, sign, monthly: split(annual, seed, wiggle), flagged });

export const T12_LINES: T12Line[] = [
  L("gpr", "Gross Potential Rent", "income", 1_063_680, "Gross potential rent", 1, 11, 0.01),
  L("vac", "Vacancy Loss", "income", 112_400, "Vacancy loss", -1, 12, 0.25),
  L("conc", "Concessions", "income", 18_600, "Concessions", -1, 13, 0.4),
  L("bad", "Bad Debt / Write-offs", "income", 9_800, "Credit loss", -1, 14, 0.5),
  L("park", "Parking Income", "income", 24_000, "Other income", 1, 15, 0.03),
  L("rubs", "Utility Reimbursement (RUBS)", "income", 22_800, "Other income", 1, 16, 0.1),
  L("laund", "Laundry & Vending", "income", 6_600, "Other income", 1, 17, 0.15),
  L("pet", "Pet & Misc. Fees", "income", 7_800, "Other income", 1, 18, 0.2),
  L("tax", "Real Estate Taxes", "expense", 148_600, "Real estate taxes", 1, 21, 0),
  L("ins", "Property Insurance", "expense", 71_700, "Insurance", 1, 22, 0),
  L("util", "Utilities", "expense", 82_300, "Utilities", 1, 23, 0.18),
  L("rm", "Repairs & Maintenance", "expense", 79_150, "Repairs & maintenance", 1, 24, 0.2, true),
  L("pay", "Payroll & Benefits", "expense", 96_500, "Payroll", 1, 25, 0.03),
  L("mgmt", "Management Fee", "expense", 39_363, "Management fee", 1, 26, 0.02),
  L("ga", "General & Administrative", "expense", 21_800, "G&A", 1, 27, 0.15),
  L("mkt", "Marketing & Leasing", "expense", 12_400, "Marketing", 1, 28, 0.3),
  L("cs", "Contract Services", "expense", 27_600, "Contract services", 1, 29, 0.05),
];

export const ROOF_AMORTIZATION = 14_250;

export const T12_TOTALS = (() => {
  const inc = T12_LINES.filter((l) => l.section === "income");
  const exp = T12_LINES.filter((l) => l.section === "expense");
  const egi = inc.reduce((a, l) => a + l.sign * l.annual, 0);
  const opexReported = exp.reduce((a, l) => a + l.annual, 0);
  const opexNormalized = opexReported - ROOF_AMORTIZATION;
  const netRental = 1_063_680 - 112_400 - 18_600 - 9_800;
  return {
    egi,
    netRental,
    otherIncome: 61_200,
    opexReported,
    opexNormalized,
    noiReported: egi - opexReported,
    noiNormalized: egi - opexNormalized,
    expenseRatio: opexNormalized / egi,
  };
})();

/* ------------------------------------------------------------------ */
/* Sponsor pro forma (stabilized, month 24)                            */
/* ------------------------------------------------------------------ */

export const PRO_FORMA_RENTS: Record<UnitType, number> = { Studio: 1_425, "1BR/1BA": 1_760, "2BR/2BA": 2_240 };
export const UNIT_MIX: Record<UnitType, number> = { Studio: 16, "1BR/1BA": 36, "2BR/2BA": 12 };

export const PRO_FORMA = (() => {
  const gpr = (Object.keys(UNIT_MIX) as UnitType[]).reduce((a, t) => a + UNIT_MIX[t] * PRO_FORMA_RENTS[t] * 12, 0);
  const vacancy = Math.round(gpr * 0.06);
  const other = 84_000;
  const egi = gpr - vacancy + other;
  const mgmt = Math.round(egi * 0.035);
  const expenses = [
    { label: "Real estate taxes", amount: 196_000 },
    { label: "Insurance", amount: 73_600 },
    { label: "Utilities (net of RUBS)", amount: 70_400 },
    { label: "Repairs & maintenance", amount: 51_200 },
    { label: "Payroll", amount: 92_000 },
    { label: "Management fee (3.5%)", amount: mgmt },
    { label: "G&A", amount: 19_200 },
    { label: "Marketing", amount: 9_600 },
    { label: "Contract services", amount: 25_600 },
    { label: "Replacement reserves ($300/unit)", amount: 19_200 },
  ];
  const opex = expenses.reduce((a, e) => a + e.amount, 0);
  return { gpr, vacancy, other, egi, expenses, opex, noi: egi - opex };
})();

/* ------------------------------------------------------------------ */
/* Renovation budget and sources & uses                                 */
/* ------------------------------------------------------------------ */

export const BUDGET_LINES = [
  { key: "interiors", label: "Unit interiors (40 units × $26,000)", category: "Hard", amount: 1_040_000 },
  { key: "common", label: "Common areas, lobby & fitness amenity", category: "Hard", amount: 185_000 },
  { key: "exterior", label: "Exterior: roof, windows & masonry repointing", category: "Hard", amount: 165_000 },
  { key: "contingency", label: "Renovation contingency", category: "Contingency", amount: 110_000 },
];
export const BUDGET_TOTAL = BUDGET_LINES.reduce((a, l) => a + l.amount, 0);
export const BUDGET_HARD = BUDGET_LINES.filter((l) => l.category === "Hard").reduce((a, l) => a + l.amount, 0);

export const USES = [
  { label: "Purchase price", amount: 8_900_000 },
  { label: "Closing costs & acquisition fees", amount: 215_000 },
  { label: "Renovation budget (holdback)", amount: BUDGET_TOTAL },
  { label: "Interest reserve", amount: 420_000 },
  { label: "Origination fee (1.00%)", amount: 84_500 },
  { label: "Lender legal & third-party reports", amount: 65_500 },
];
export const TOTAL_USES = USES.reduce((a, u) => a + u.amount, 0);
export const SOURCES = [
  { label: "Senior loan — initial advance", amount: 6_950_000 },
  { label: "Senior loan — future funding (renovation)", amount: 1_500_000 },
  { label: "Sponsor cash equity", amount: TOTAL_USES - 8_450_000 },
];

/* ------------------------------------------------------------------ */
/* Appraisal (Brightline Valuation Advisors, 142 pp.)                   */
/* ------------------------------------------------------------------ */

export const APPRAISAL = {
  firm: "Brightline Valuation Advisors",
  appraiser: "MAI, SRA — Certified General Appraiser (MD)",
  reportDate: "2026-10-22",
  effectiveDate: "2026-09-18",
  completeDate: "2027-09-01",
  stabilizedDate: "2028-09-01",
  interest: "Fee simple",
  asIs: 9_150_000,
  asComplete: 12_300_000,
  asStabilized: 12_950_000,
  capRate: 0.0575,
  egi: 1_342_600,
  expenses: 598_100,
  noi: 744_500,
  occupancy: 0.89,
  concludedRents: { Studio: 1_450, "1BR/1BA": 1_775, "2BR/2BA": 2_150 } as Record<UnitType, number>,
  rentComps: [
    { name: "The Boatyard Residences", distance: "0.4 mi", built: 2019, studio: 1_495, one: 1_810, two: 2_210 },
    { name: "Canton Mill Apartments", distance: "0.6 mi", built: 1910, studio: 1_420, one: 1_740, two: 2_120 },
    { name: "Elliott Street Flats", distance: "0.8 mi", built: 2016, studio: 1_465, one: 1_795, two: 2_180 },
    { name: "Brewers Hill Lofts", distance: "1.1 mi", built: 1928, studio: 1_390, one: 1_720, two: 2_090 },
    { name: "Highlandtown Commons", distance: "1.3 mi", built: 2012, studio: 1_410, one: 1_750, two: 2_140 },
  ],
  salesComps: [
    { name: "Fleet Street Lofts (52 units)", date: "2026-06", price: 7_850_000, perUnit: 150_962, cap: 0.0545 },
    { name: "Patterson Place (71 units)", date: "2026-03", price: 10_400_000, perUnit: 146_479, cap: 0.0562 },
    { name: "Hudson Street Flats (40 units)", date: "2025-12", price: 5_750_000, perUnit: 143_750, cap: 0.0578 },
    { name: "Clinton Wharf (88 units)", date: "2025-09", price: 13_900_000, perUnit: 157_955, cap: 0.0531 },
  ],
};

/* ------------------------------------------------------------------ */
/* Sponsor PFS + REO schedule (scanned)                                 */
/* ------------------------------------------------------------------ */

export const PFS = {
  statementDate: "2026-03-31",
  totalAssets: 31_640_000,
  totalLiabilities: 17_420_000,
  netWorth: 14_220_000,
  cash: 1_315_000,
  securities: 600_000,
  liquidity: 1_915_000,
  realEstateAtShare: 26_850_000,
  otherAssets: 2_875_000,
  contingent: 22_600_000,
  reo: [
    { name: "Fells Point Flats (48u)", own: 0.6, value: 9_600_000, debt: 6_100_000, noi: 552_000 },
    { name: "Patterson Park Rowhomes (22u)", own: 1, value: 4_200_000, debt: 2_650_000, noi: 236_000 },
    { name: "Highlandtown Lofts (36u)", own: 0.5, value: 7_400_000, debt: 4_900_000, noi: 418_000 },
    { name: "Remsen Court (30u)", own: 1, value: 5_100_000, debt: 3_300_000, noi: 291_000 },
    { name: "Druid Hill Apartments (58u)", own: 0.35, value: 10_800_000, debt: 7_200_000, noi: 604_000 },
    { name: "Waverly Corner Retail", own: 1, value: 3_300_000, debt: 1_950_000, noi: 214_000 },
    { name: "Hamilton Mews (18u)", own: 1, value: 2_900_000, debt: 1_700_000, noi: 168_000 },
    { name: "Canton Garages (lot)", own: 1, value: 1_450_000, debt: 0, noi: 61_000 },
    { name: "Ellicott City Flats (24u)", own: 0.5, value: 4_650_000, debt: 3_000_000, noi: 262_000 },
  ],
};

/* ------------------------------------------------------------------ */
/* Interest reserve adequacy (24-month carry projection)               */
/* ------------------------------------------------------------------ */

export const SOFR = 0.043;
export const ALL_IN_RATE = SOFR + 0.0475;

export function interestCarry(reserve = 420_000) {
  const rows: { month: number; balance: number; interest: number; noi: number; shortfall: number }[] = [];
  const stabilizedMonthly = APPRAISAL.noi / 12;
  const inPlaceMonthly = T12_TOTALS.noiNormalized / 12;
  for (let m = 1; m <= 24; m++) {
    const balance = 6_950_000 + 125_000 * Math.min(m, 12);
    const interest = (balance * ALL_IN_RATE) / 12;
    // units offline during renovation (months 2-12) trim NOI ~8%; then ramp to stabilized by month 24
    const base = m <= 6 ? inPlaceMonthly : inPlaceMonthly + ((stabilizedMonthly - inPlaceMonthly) * (m - 6)) / 18;
    const noi = m >= 2 && m <= 12 ? base * 0.92 : base;
    rows.push({ month: m, balance, interest, noi, shortfall: Math.max(0, interest - noi) });
  }
  const shortfall = rows.reduce((a, r) => a + r.shortfall, 0);
  return { rows, shortfall, reserve, coverage: reserve / shortfall };
}
