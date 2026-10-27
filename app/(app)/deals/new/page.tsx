"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Copy, Sparkles, Loader2, TriangleAlert } from "lucide-react";
import { useApp, nowIso } from "@/lib/store";
import { SPONSORS, BROKERS, SPONSOR } from "@/lib/data/relationships";
import { PARTNER, PARTNERS } from "@/lib/data/partners";
import { factsFor, screen } from "@/lib/engine/buybox";
import { dealMetrics } from "@/lib/engine/sizing";
import { useCan } from "@/lib/hooks";
import { money, pct, times } from "@/lib/format";
import type { AssetType, Deal, ProductType, Recourse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClaudeChip, PageHeader, Panel, ScreenPill } from "@/components/common/ui";

const ASSETS: AssetType[] = ["Multifamily", "Industrial", "Retail", "Mixed-Use", "Hospitality", "Self-Storage", "Entertainment", "Medical Office"];
const PRODUCTS: ProductType[] = ["Ground-Up Construction", "Value-Add Bridge", "Bridge", "Redevelopment"];
const STATES = ["MD", "DC", "VA", "PA", "DE", "NC"];

interface Form {
  name: string;
  address: string;
  city: string;
  state: string;
  submarket: string;
  assetType: AssetType;
  productType: ProductType;
  units: string;
  sponsorId: string;
  brokerId: string;
  borrowerEntity: string;
  recourse: Recourse;
  loanAmount: string;
  totalCost: string;
  stabilizedValue: string;
  stabilizedNoi: string;
  termMonths: string;
}

const EMPTY: Form = {
  name: "",
  address: "",
  city: "",
  state: "MD",
  submarket: "",
  assetType: "Multifamily",
  productType: "Value-Add Bridge",
  units: "",
  sponsorId: "calloway",
  brokerId: "northbay",
  borrowerEntity: "",
  recourse: "Partial recourse",
  loanAmount: "",
  totalCost: "",
  stabilizedValue: "",
  stabilizedNoi: "",
  termMonths: "24",
};

const OM_PREFILL: Form = {
  name: "Station North Lofts",
  address: "1700 N Charles St",
  city: "Baltimore",
  state: "MD",
  submarket: "Station North",
  assetType: "Multifamily",
  productType: "Value-Add Bridge",
  units: "42",
  sponsorId: "calloway",
  brokerId: "northbay",
  borrowerEntity: "Station North Lofts LLC",
  recourse: "Partial recourse",
  loanAmount: "5200000",
  totalCost: "6900000",
  stabilizedValue: "7600000",
  stabilizedNoi: "505000",
  termMonths: "24",
};

const num = (s: string) => Number(s.replace(/[^0-9.]/g, "")) || 0;

function tokens(s: string) {
  return new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !["the", "and", "street", "ave", "st"].includes(w)));
}
function jaccard(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let i = 0;
  a.forEach((x) => b.has(x) && i++);
  return i / (a.size + b.size - i);
}

function Field({ ai, label, children }: { ai: boolean; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        {ai && (
          <span className="flex items-center gap-1 text-[10.5px] font-medium text-brand-strong">
            <Sparkles className="size-3" /> AI-prefilled
          </span>
        )}
      </div>
      <div className={cn("mt-1.5 rounded-lg", ai && "ring-2 ring-brand/30")}>{children}</div>
    </div>
  );
}

const STEPS = ["Deal & property", "Sponsor & broker", "Request & economics", "Review & screen"];

export default function NewDealPage() {
  const router = useRouter();
  const deals = useApp((s) => s.deals);
  const createDeal = useApp((s) => s.createDeal);
  const persona = useApp((s) => s.persona);
  const canCreate = useCan("deal.create");
  const [step, setStep] = React.useState(0);
  const [f, setF] = React.useState<Form>(EMPTY);
  const [prefilling, setPrefilling] = React.useState(false);
  const [aiFilled, setAiFilled] = React.useState<Set<keyof Form>>(new Set());

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    setAiFilled((s) => {
      const n = new Set(s);
      n.delete(k);
      return n;
    });
  };

  const prefill = () => {
    setPrefilling(true);
    const keys = Object.keys(OM_PREFILL) as (keyof Form)[];
    keys.forEach((k, i) =>
      setTimeout(() => {
        setF((x) => ({ ...x, [k]: OM_PREFILL[k] }));
        setAiFilled((s) => new Set(s).add(k));
        if (i === keys.length - 1) {
          setPrefilling(false);
          toast.success("Prefilled from offering memorandum", { description: "17 fields drafted by Claude · verify before saving" });
        }
      }, 120 * i),
    );
  };

  // Duplicate detection (fuzzy name/address + same sponsor near same amount)
  const dupes = React.useMemo(() => {
    if (!f.name && !f.address) return [];
    return deals
      .map((d) => {
        const nameScore = jaccard(tokens(f.name), tokens(d.name));
        const addrScore = jaccard(tokens(f.address + " " + f.city), tokens(d.address + " " + d.city));
        const amt = num(f.loanAmount);
        const sameSponsor = f.sponsorId === d.sponsorId && amt > 0 && Math.abs(amt - d.loanAmount) / d.loanAmount < 0.15;
        const score = Math.max(nameScore, addrScore * 0.9) + (sameSponsor ? 0.25 : 0);
        return { d, score: Math.min(0.99, score) };
      })
      .filter((x) => x.score >= 0.45)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [deals, f.name, f.address, f.city, f.loanAmount, f.sponsorId]);

  const draft: Deal = {
    id: "draft",
    code: "TK-26-0XX",
    name: f.name || "Untitled deal",
    stage: "intake",
    assetType: f.assetType,
    productType: f.productType,
    purpose: f.productType === "Ground-Up Construction" ? "Construction" : "Acquisition",
    address: f.address,
    city: f.city,
    state: f.state,
    submarket: f.submarket || f.city,
    units: num(f.units) || undefined,
    sponsorId: f.sponsorId,
    brokerId: f.brokerId,
    borrowerEntity: f.borrowerEntity || `${f.name || "Borrower"} LLC`,
    loanAmount: num(f.loanAmount),
    totalCost: num(f.totalCost) || 1,
    stabilizedValue: num(f.stabilizedValue) || 1,
    stabilizedNoi: num(f.stabilizedNoi),
    recourse: f.recourse,
    spreadBps: 500,
    termMonths: num(f.termMonths) || 24,
    owner: persona,
    createdAt: "2026-10-27T15:00:00.000Z",
    stageEnteredAt: "2026-10-27T15:00:00.000Z",
    docsApproved: 0,
    docsTotal: 5,
    openFlags: 0,
    hasPhaseOneEsa: false,
    hasGmpContract: false,
    tags: ["New"],
    notes: [],
    history: [],
  };
  const economicsReady = num(f.loanAmount) > 0 && num(f.totalCost) > 0 && num(f.stabilizedValue) > 0 && num(f.stabilizedNoi) > 0;
  const m = economicsReady ? dealMetrics(draft) : null;
  const preview = economicsReady ? PARTNERS.map((p) => screen(p, factsFor(draft, SPONSOR[f.sponsorId]))) : [];
  const canNext = step === 0 ? f.name && f.address && f.city : step === 1 ? f.sponsorId && f.brokerId : step === 2 ? economicsReady : true;

  const submit = () => {
    if (!canCreate) {
      toast.error("Your role can't create deals.");
      return;
    }
    const at = nowIso();
    const id = `${f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${at.slice(-7, -5)}${at.slice(-4, -1)}`;
    const code = `TK-26-${String(60 + deals.length).padStart(3, "0")}`;
    const deal: Deal = {
      ...draft,
      id,
      code,
      createdAt: at,
      stageEnteredAt: at,
      history: [{ id: `${id}-h0`, at, by: persona, from: null, to: "intake", reason: aiFilled.size ? "Created from OM (Claude prefill, verified)" : "Created via intake form" }],
    };
    createDeal(deal);
    toast.success(`${deal.name} created`, { description: `${code} · screened against ${PARTNERS.length} partners` });
    router.push(`/deals/${id}`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Origination"
        title="New deal"
        description="Structured intake with duplicate detection. Buy-box screening runs automatically as soon as economics are entered."
        actions={
          <Button variant="outline" size="lg" onClick={prefill} disabled={prefilling}>
            {prefilling ? <Loader2 className="animate-spin" /> : <Sparkles className="text-brand" />} Prefill from offering memorandum
          </Button>
        }
      />

      <ol className="grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              onClick={() => i <= step && setStep(i)}
              className={cn("flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[12.5px] transition", i === step ? "border-ink bg-card shadow-sm" : i < step ? "bg-card" : "bg-muted/40 text-muted-foreground")}
            >
              <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold", i < step ? "bg-pass text-white" : i === step ? "bg-ink text-white" : "bg-muted text-muted-foreground")}>
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className="hidden truncate font-medium sm:block">{s}</span>
            </button>
          </li>
        ))}
      </ol>

      {dupes.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-soft/40 bg-soft-soft p-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-soft">
            <Copy className="size-4" /> Possible duplicate{dupes.length > 1 ? "s" : ""}: review before creating
          </div>
          <ul className="mt-2 space-y-1.5">
            {dupes.map(({ d, score }) => (
              <li key={d.id} className="flex items-center justify-between rounded-lg bg-card/70 px-3 py-2 text-[12.5px]">
                <span>
                  <b className="text-ink">{d.name}</b> <span className="text-muted-foreground">· {d.code} · {d.address}, {d.city} · {money(d.loanAmount)}</span>
                </span>
                <span className="font-mono text-[11.5px] font-semibold text-soft">{Math.round(score * 100)}% match</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11.5px] text-ink/60">Surfaced for operator review; records are never merged automatically.</p>
        </motion.div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title={STEPS[step]}>
          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field ai={aiFilled.has("name")} label="Deal name"><Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Harborview Lofts" /></Field>
              <Field ai={aiFilled.has("address")} label="Street address"><Input value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="2815 Harborview Way" /></Field>
              <Field ai={aiFilled.has("city")} label="City"><Input value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field ai={aiFilled.has("state")} label="State">
                  <Select value={f.state} onValueChange={(v) => set("state", v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field ai={aiFilled.has("submarket")} label="Submarket"><Input value={f.submarket} onChange={(e) => set("submarket", e.target.value)} /></Field>
              </div>
              <Field ai={aiFilled.has("assetType")} label="Asset type">
                <Select value={f.assetType} onValueChange={(v) => set("assetType", v as AssetType)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSETS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field ai={aiFilled.has("productType")} label="Product">
                <Select value={f.productType} onValueChange={(v) => set("productType", v as ProductType)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRODUCTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field ai={aiFilled.has("units")} label="Units (if residential)"><Input value={f.units} onChange={(e) => set("units", e.target.value)} /></Field>
            </div>
          )}
          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field ai={aiFilled.has("sponsorId")} label="Sponsor">
                <Select value={f.sponsorId} onValueChange={(v) => set("sponsorId", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{SPONSORS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field ai={aiFilled.has("brokerId")} label="Broker">
                <Select value={f.brokerId} onValueChange={(v) => set("brokerId", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{BROKERS.map((s) => <SelectItem key={s.id} value={s.id}>{s.firm}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field ai={aiFilled.has("borrowerEntity")} label="Borrowing entity"><Input value={f.borrowerEntity} onChange={(e) => set("borrowerEntity", e.target.value)} placeholder="Property Owner LLC" /></Field>
              <Field ai={aiFilled.has("recourse")} label="Recourse offered">
                <Select value={f.recourse} onValueChange={(v) => set("recourse", v as Recourse)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{(["Full recourse", "Partial recourse", "Non-recourse"] as Recourse[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <div className="rounded-xl bg-muted/50 p-3 text-[12.5px] md:col-span-2">
                <b className="text-ink">{SPONSOR[f.sponsorId]?.name}</b>
                <span className="text-muted-foreground"> · NW {money(SPONSOR[f.sponsorId]?.netWorth ?? 0)} · liquidity {money(SPONSOR[f.sponsorId]?.liquidity ?? 0)} · {SPONSOR[f.sponsorId]?.activeProjects} active projects</span>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field ai={aiFilled.has("loanAmount")} label="Requested loan ($)"><Input value={f.loanAmount} onChange={(e) => set("loanAmount", e.target.value)} className="tnum" /></Field>
              <Field ai={aiFilled.has("totalCost")} label="Total project cost ($)"><Input value={f.totalCost} onChange={(e) => set("totalCost", e.target.value)} className="tnum" /></Field>
              <Field ai={aiFilled.has("stabilizedValue")} label="As-stabilized value ($)"><Input value={f.stabilizedValue} onChange={(e) => set("stabilizedValue", e.target.value)} className="tnum" /></Field>
              <Field ai={aiFilled.has("stabilizedNoi")} label="Stabilized NOI ($)"><Input value={f.stabilizedNoi} onChange={(e) => set("stabilizedNoi", e.target.value)} className="tnum" /></Field>
              <Field ai={aiFilled.has("termMonths")} label="Term (months)"><Input value={f.termMonths} onChange={(e) => set("termMonths", e.target.value)} /></Field>
              <div className="flex items-end text-[11.5px] text-muted-foreground">Intake values are unverified until documents are extracted and approved.</div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid gap-x-8 gap-y-1 text-[13px] md:grid-cols-2">
                {[
                  ["Deal", f.name],
                  ["Location", `${f.address}, ${f.city}, ${f.state}`],
                  ["Asset / product", `${f.assetType} · ${f.productType}`],
                  ["Sponsor", SPONSOR[f.sponsorId]?.name],
                  ["Request", money(num(f.loanAmount))],
                  ["Total cost", money(num(f.totalCost))],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b py-1.5">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-ink">{v}</span>
                  </div>
                ))}
              </div>
              {aiFilled.size > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-brand/30 bg-brand-soft/60 p-3 text-[12.5px] text-ink/80">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-brand-strong" /> {aiFilled.size} values were drafted by Claude from the OM. Saving records you as the verifier.
                </div>
              )}
            </div>
          )}
          <div className="mt-6 flex justify-between border-t pt-4">
            <Button variant="ghost" onClick={() => (step === 0 ? router.push("/pipeline") : setStep(step - 1))}>
              <ArrowLeft /> {step === 0 ? "Cancel" : "Back"}
            </Button>
            {step < 3 ? (
              <Button disabled={!canNext} onClick={() => setStep(step + 1)}>
                Continue <ArrowRight />
              </Button>
            ) : (
              <Button onClick={submit}>
                <Check /> Create deal in Intake
              </Button>
            )}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Live screening preview" description="Updates as you type">
            {!economicsReady ? (
              <p className="text-[12.5px] text-muted-foreground">Enter loan, cost, value and NOI to screen against all capital partners.</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center text-[11.5px]">
                  {[
                    ["LTC", pct(m!.ltc)],
                    ["LTV", pct(m!.ltv)],
                    ["DSCR", times(m!.dscr)],
                    ["Debt yield", pct(m!.debtYield, 2)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-muted/60 py-2">
                      <div className="text-muted-foreground">{k}</div>
                      <div className="font-semibold text-ink tnum">{v}</div>
                    </div>
                  ))}
                </div>
                {preview.map((r) => (
                  <div key={r.partnerId} className="flex items-center justify-between text-[12.5px]">
                    <span className="text-ink">{PARTNER[r.partnerId].short}</span>
                    <ScreenPill status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="From the OM">
            <div className="flex items-center gap-2"><ClaudeChip>Prefill</ClaudeChip></div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
              Drop a broker OM or email and Claude drafts the intake form with page citations. Every prefilled field is flagged until a person
              verifies it.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
