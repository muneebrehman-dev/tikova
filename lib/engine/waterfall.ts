// Phase 2+ preview: participation allocation and payment waterfall.
// Interest is Actual/360; each participant accrues at its own pass-through
// coupon and the spread between borrower rate and coupon is Tikova's strip.

export interface ParticipationShare {
  partnerId: string;
  name: string;
  share: number; // of principal
  coupon: number; // annual pass-through rate
  color: string;
}

export interface WaterfallInput {
  balance: number;
  borrowerRate: number;
  days: number;
  cashReceived: number;
  lateFees: number;
  exitFeePct: number; // applied to principal repaid when principal > 0
  shares: ParticipationShare[];
}

export interface WaterfallStep {
  key: string;
  label: string;
  description: string;
  available: number;
  applied: number;
  allocations: { name: string; amount: number; color: string }[];
}

const TIKOVA = { name: "Tikova (manager)", color: "#d9922e" };

export function runWaterfall(i: WaterfallInput): { steps: WaterfallStep[]; totals: Record<string, number> } {
  let cash = i.cashReceived;
  const steps: WaterfallStep[] = [];
  const totals: Record<string, number> = {};
  const add = (name: string, amt: number) => (totals[name] = (totals[name] ?? 0) + amt);

  // 1. Late fees / default interest -> Tikova as servicer
  const late = Math.min(cash, i.lateFees);
  cash -= late;
  add(TIKOVA.name, late);
  steps.push({
    key: "fees",
    label: "1 · Late fees & default interest",
    description: "Retained by Tikova as servicer per servicing agreement.",
    available: i.cashReceived,
    applied: late,
    allocations: late ? [{ name: TIKOVA.name, amount: late, color: TIKOVA.color }] : [],
  });

  // 2. Current interest: borrower accrual, partner coupons, Tikova strip
  const borrowerInterest = (i.balance * i.borrowerRate * i.days) / 360;
  const interestPaid = Math.min(cash, borrowerInterest);
  const ratio = borrowerInterest ? interestPaid / borrowerInterest : 0;
  const partnerInterest = i.shares.map((s) => ({
    name: s.name,
    color: s.color,
    amount: ((i.balance * s.share * s.coupon * i.days) / 360) * ratio,
  }));
  const strip = interestPaid - partnerInterest.reduce((a, b) => a + b.amount, 0);
  cash -= interestPaid;
  partnerInterest.forEach((p) => add(p.name, p.amount));
  add(TIKOVA.name, strip);
  steps.push({
    key: "interest",
    label: "2 · Accrued interest",
    description: `Borrower accrual ${fmtRate(i.borrowerRate)} Act/360 for ${i.days} days; partners paid at pass-through coupon, spread retained as servicing strip.`,
    available: i.cashReceived - late,
    applied: interestPaid,
    allocations: [...partnerInterest, { name: `${TIKOVA.name} · strip`, amount: strip, color: TIKOVA.color }],
  });

  // 3. Principal, pro rata by participation share (net of exit fee)
  const principalCash = Math.max(0, cash);
  const principal = Math.min(principalCash / (1 + i.exitFeePct), i.balance);
  const exitFee = principal * i.exitFeePct;
  const principalAlloc = i.shares.map((s) => ({ name: s.name, color: s.color, amount: principal * s.share }));
  principalAlloc.forEach((p) => add(p.name, p.amount));
  cash -= principal;
  steps.push({
    key: "principal",
    label: "3 · Principal",
    description: "Applied pro rata to participation shares; reduces each partner's balance.",
    available: principalCash,
    applied: principal,
    allocations: principalAlloc,
  });

  // 4. Exit fee, split 50% Tikova / 50% partners pro rata
  const exitPaid = Math.min(cash, exitFee);
  const exitAlloc = [
    { name: TIKOVA.name, color: TIKOVA.color, amount: exitPaid * 0.5 },
    ...i.shares.map((s) => ({ name: s.name, color: s.color, amount: exitPaid * 0.5 * s.share })),
  ];
  exitAlloc.forEach((p) => add(p.name, p.amount));
  cash -= exitPaid;
  steps.push({
    key: "exit",
    label: "4 · Exit fee",
    description: "Split 50% to Tikova, 50% to participants pro rata (per participation agreement).",
    available: Math.max(0, principalCash - principal),
    applied: exitPaid,
    allocations: exitPaid ? exitAlloc : [],
  });

  // 5. Residual -> suspense for review
  steps.push({
    key: "residual",
    label: "5 · Residual / suspense",
    description: "Any unapplied cash is held in suspense pending servicer review.",
    available: Math.max(0, cash),
    applied: Math.max(0, cash),
    allocations: cash > 0.005 ? [{ name: "Suspense", amount: cash, color: "#a1a1aa" }] : [],
  });

  return { steps, totals };
}

function fmtRate(r: number) {
  return `${(r * 100).toFixed(2)}%`;
}
