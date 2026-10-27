// Buy-box rules engine. Rules are versioned JSON per capital partner; every
// result records the version it was evaluated against.
import type {
  BuyBoxRule,
  CapitalPartner,
  Deal,
  RuleResult,
  ScreenStatus,
  ScreeningResult,
  Sponsor,
} from "@/lib/types";
import { dealMetrics } from "./sizing";
import { money, moneyShort, pct, times } from "@/lib/format";

export interface ScreeningFacts {
  assetType: string;
  productType: string;
  state: string;
  loanAmount: number;
  ltc: number;
  ltv: number;
  dscr: number;
  debtYield: number;
  liquidityRatio: number;
  netWorthRatio: number;
  recourse: string;
  phaseOneEsa: boolean;
  gmpContract: boolean;
}

export function factsFor(deal: Deal, sponsor: Sponsor | undefined): ScreeningFacts {
  const m = dealMetrics(deal);
  return {
    assetType: deal.assetType,
    productType: deal.productType,
    state: deal.state,
    loanAmount: deal.loanAmount,
    ltc: m.ltc,
    ltv: m.ltv,
    dscr: m.dscr,
    debtYield: m.debtYield,
    liquidityRatio: sponsor ? sponsor.liquidity / deal.loanAmount : 0,
    netWorthRatio: sponsor ? sponsor.netWorth / deal.loanAmount : 0,
    recourse: deal.recourse,
    phaseOneEsa: deal.hasPhaseOneEsa,
    gmpContract: deal.hasGmpContract,
  };
}

function fmt(metric: BuyBoxRule["metric"], v: unknown): string {
  if (Array.isArray(v)) {
    if (typeof v[0] === "number") return `${moneyShort(v[0] as number)} – ${moneyShort(v[1] as number)}`;
    return (v as string[]).join(", ");
  }
  if (typeof v === "boolean") return v ? "Received" : "Not received";
  if (typeof v === "number") {
    switch (metric) {
      case "ltc":
      case "ltv":
      case "debtYield":
        return pct(v, 1);
      case "dscr":
        return times(v);
      case "loanAmount":
        return money(v);
      case "liquidityRatio":
      case "netWorthRatio":
        return `${v.toFixed(2)}x loan`;
    }
  }
  return String(v);
}

const OP_TEXT: Record<BuyBoxRule["op"], string> = {
  in: "one of",
  lte: "≤",
  gte: "≥",
  between: "between",
  present: "",
  eq: "=",
};

export function evaluateRule(rule: BuyBoxRule, f: ScreeningFacts): RuleResult {
  if (rule.appliesTo && !rule.appliesTo.includes(f.productType as never)) {
    return {
      rule,
      outcome: "pass",
      actual: "n/a",
      expected: `Only for ${rule.appliesTo.join(", ")}`,
      reason: `Not applicable to ${f.productType}`,
    };
  }
  const actualRaw = f[rule.metric as keyof ScreeningFacts];
  const actual = fmt(rule.metric, actualRaw);
  const expected =
    rule.op === "present"
      ? "Required document"
      : `${OP_TEXT[rule.op]} ${fmt(rule.metric, rule.value)}`.trim();

  let ok = true;
  switch (rule.op) {
    case "in":
      ok = (rule.value as string[]).includes(String(actualRaw));
      break;
    case "lte":
      ok = (actualRaw as number) <= (rule.value as number) + 1e-9;
      break;
    case "gte":
      ok = (actualRaw as number) >= (rule.value as number) - 1e-9;
      break;
    case "between": {
      const [lo, hi] = rule.value as [number, number];
      ok = (actualRaw as number) >= lo && (actualRaw as number) <= hi;
      break;
    }
    case "eq":
      ok = actualRaw === rule.value;
      break;
    case "present":
      ok = Boolean(actualRaw);
      break;
  }

  if (rule.kind === "required") {
    return {
      rule,
      outcome: ok ? "pass" : "missing",
      actual,
      expected,
      reason: ok ? `${rule.label} on file` : `${rule.label} not yet received — screening cannot complete`,
    };
  }
  return {
    rule,
    outcome: ok ? "pass" : "fail",
    actual,
    expected,
    reason: ok
      ? `${actual} meets ${expected}`
      : `${actual} vs ${expected}${rule.kind === "soft" ? " (preference)" : ""}`,
  };
}

export function screen(partner: CapitalPartner, f: ScreeningFacts): ScreeningResult {
  const bb = partner.buyBox[partner.buyBox.length - 1];
  const results = bb.rules.map((r) => evaluateRule(r, f));
  const hardFail = results.some((r) => r.rule.kind === "hard" && r.outcome === "fail");
  const missing = results.some((r) => r.outcome === "missing");
  const softMiss = results.some((r) => r.rule.kind === "soft" && r.outcome === "fail");
  const status: ScreenStatus = hardFail
    ? "hard_fail"
    : missing
      ? "incomplete"
      : softMiss
        ? "soft_miss"
        : "pass";
  return { partnerId: partner.id, version: bb.version, status, results };
}

export const SCREEN_META: Record<
  ScreenStatus,
  { label: string; tone: "pass" | "soft" | "fail" | "info"; short: string }
> = {
  pass: { label: "Pass", tone: "pass", short: "Fit" },
  soft_miss: { label: "Soft miss", tone: "soft", short: "Soft" },
  hard_fail: { label: "Hard fail", tone: "fail", short: "No fit" },
  incomplete: { label: "Incomplete", tone: "info", short: "Pending" },
};
