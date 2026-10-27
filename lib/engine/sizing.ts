// Deterministic sizing engine. This is plain code, never the LLM: the same
// inputs on the same formula version always produce the same outputs.
import type {
  ConstraintResult,
  SizingInputs,
  SizingOutputs,
  SizingPolicy,
} from "@/lib/types";

export const FORMULA_VERSION = "sizing-1.4.0";

/** Annual loan constant: interest-only when amortYears = 0. */
export function loanConstant(rate: number, amortYears: number): number {
  if (amortYears <= 0) return rate;
  const r = rate / 12;
  const n = amortYears * 12;
  return (12 * r) / (1 - Math.pow(1 + r, -n));
}

export function size(inputs: SizingInputs): SizingOutputs {
  const { requestedLoan, totalCost, value, noi, takeoutRate, amortYears, policy } = inputs;
  const constant = loanConstant(takeoutRate, amortYears);
  const annualDebtService = requestedLoan * constant;

  const ltc = requestedLoan / totalCost;
  const ltv = requestedLoan / value;
  const dscr = noi / annualDebtService;
  const debtYield = noi / requestedLoan;

  const constraints: ConstraintResult[] = [
    {
      key: "ltc",
      label: "Loan-to-Cost",
      maxLoan: policy.maxLtc * totalCost,
      actual: ltc,
      threshold: policy.maxLtc,
      passes: ltc <= policy.maxLtc + 1e-9,
    },
    {
      key: "ltv",
      label: "Loan-to-Value",
      maxLoan: policy.maxLtv * value,
      actual: ltv,
      threshold: policy.maxLtv,
      passes: ltv <= policy.maxLtv + 1e-9,
    },
    {
      key: "dscr",
      label: "DSCR",
      maxLoan: noi / (policy.minDscr * constant),
      actual: dscr,
      threshold: policy.minDscr,
      passes: dscr >= policy.minDscr - 1e-9,
    },
    {
      key: "debtYield",
      label: "Debt Yield",
      maxLoan: noi / policy.minDebtYield,
      actual: debtYield,
      threshold: policy.minDebtYield,
      passes: debtYield >= policy.minDebtYield - 1e-9,
    },
  ];

  const bindingC = constraints.reduce((a, b) => (b.maxLoan < a.maxLoan ? b : a));
  return {
    ltc,
    ltv,
    dscr,
    debtYield,
    annualDebtService,
    loanConstant: constant,
    constraints,
    maxLoan: bindingC.maxLoan,
    binding: bindingC.key,
    headroom: bindingC.maxLoan - requestedLoan,
  };
}

/** Quick metrics for pipeline-level screening (standard take-out test). */
export const STANDARD_TAKEOUT = { rate: 0.06, amortYears: 30 };

export function dealMetrics(d: {
  loanAmount: number;
  totalCost: number;
  stabilizedValue: number;
  stabilizedNoi: number;
}) {
  const constant = loanConstant(STANDARD_TAKEOUT.rate, STANDARD_TAKEOUT.amortYears);
  return {
    ltc: d.loanAmount / d.totalCost,
    ltv: d.loanAmount / d.stabilizedValue,
    debtYield: d.stabilizedNoi / d.loanAmount,
    dscr: d.stabilizedNoi / (d.loanAmount * constant),
  };
}

export function policyFromPartnerRules(
  id: string,
  label: string,
  rules: { metric: string; op: string; value: unknown; kind: string }[],
  fallback: SizingPolicy,
): SizingPolicy {
  const get = (metric: string) =>
    rules.find((r) => r.metric === metric && r.kind !== "required")?.value as number | undefined;
  return {
    id,
    label,
    maxLtc: get("ltc") ?? fallback.maxLtc,
    maxLtv: get("ltv") ?? fallback.maxLtv,
    minDscr: get("dscr") ?? fallback.minDscr,
    minDebtYield: get("debtYield") ?? fallback.minDebtYield,
  };
}

export const TIKOVA_CREDIT_POLICY: SizingPolicy = {
  id: "tikova",
  label: "Tikova Credit Policy (house)",
  maxLtc: 0.8,
  maxLtv: 0.75,
  minDscr: 1.2,
  minDebtYield: 0.08,
};
