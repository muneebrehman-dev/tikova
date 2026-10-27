"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Download, FilePenLine, Send, Lock } from "lucide-react";
import { useApp, useDeal, nowIso } from "@/lib/store";
import { SPONSOR } from "@/lib/data/relationships";
import { useCan } from "@/lib/hooks";
import { date, money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Panel, Pill } from "@/components/common/ui";

interface Term {
  k: string;
  v1: string;
  v2?: string;
}

export default function TermSheetTab() {
  const { id } = useParams<{ id: string }>();
  const deal = useDeal(id);
  const log = useApp((s) => s.log);
  const persona = useApp((s) => s.persona);
  const canEdit = useCan("termsheet.edit");
  const [version, setVersion] = React.useState<1 | 2>(2);
  if (!deal) return null;
  const isHero = deal.id === "harborview";
  const sponsor = SPONSOR[deal.sponsorId];
  const spread = (deal.spreadBps / 100).toFixed(2);

  const terms: Term[] = isHero
    ? [
        { k: "Lender", v1: "Tikova, as lead lender and servicer of record" },
        { k: "Borrower", v1: deal.borrowerEntity },
        { k: "Guarantor", v1: "Marcus Calloway: standard non-recourse carve-outs", v2: "Marcus Calloway: completion guaranty, 25% repayment guaranty and standard non-recourse carve-outs" },
        { k: "Loan amount", v1: "Up to $8,450,000 ($6,950,000 initial advance; $1,500,000 future funding for renovation)" },
        { k: "Interest rate", v1: "1-Month Term SOFR + 4.95%, SOFR floor 3.50%", v2: "1-Month Term SOFR + 4.75%, SOFR floor 3.50%" },
        { k: "Interest-rate cap", v1: "Not required", v2: "Required for initial term; SOFR strike ≤ 5.50%" },
        { k: "Term", v1: "24 months; two 6-month extensions at 0.25% each, subject to DSCR ≥ 1.20x and debt yield ≥ 8.0%" },
        { k: "Fees", v1: "Origination 1.00%; exit fee 0.50% (waived on Tikova refinance)" },
        { k: "Interest reserve", v1: "$420,000, held by lender", v2: "$445,000, sized to ≥ 110% of projected carry shortfall" },
        { k: "Future funding", v1: "Advanced monthly against inspected progress; 10% retainage on hard costs until completion" },
        { k: "Prepayment", v1: "12 months minimum interest; open thereafter" },
        { k: "Reserves", v1: "Replacement reserve $300/unit/yr; tax & insurance escrows" },
        { k: "Conditions", v1: "Satisfactory appraisal, Phase I ESA, PCA, title and survey", v2: "Phase I ESA; updated sponsor PFS (≤ 180 days); PCA, title and survey (appraisal received)" },
      ]
    : [
        { k: "Lender", v1: "Tikova, as lead lender and servicer of record" },
        { k: "Borrower", v1: deal.borrowerEntity },
        { k: "Guarantor", v1: `${sponsor?.principal}: ${deal.recourse === "Full recourse" ? "full recourse guaranty" : "completion guaranty and carve-outs"}` },
        { k: "Loan amount", v1: `Up to ${money(deal.loanAmount)}` },
        { k: "Interest rate", v1: `1-Month Term SOFR + ${spread}%, SOFR floor 3.50%` },
        { k: "Term", v1: `${deal.termMonths} months; two 6-month extensions at 0.25% each` },
        { k: "Fees", v1: "Origination 1.00%; exit fee 0.50%" },
        { k: "Conditions", v1: "Satisfactory third-party reports, title, survey and insurance" },
      ];

  const versions = isHero
    ? [
        { n: 1 as const, label: "v1 · Indicative terms", status: "Sent to sponsor", at: "2026-10-06" },
        { n: 2 as const, label: "v2 · Post-appraisal draft", status: "Draft", at: "2026-10-27" },
      ]
    : [{ n: 1 as const, label: "v1", status: deal.stage === "term_sheet" || deal.stage === "committee" || deal.stage === "approved" ? "Issued" : "Not issued", at: deal.stageEnteredAt.slice(0, 10) }];
  const v = isHero ? version : 1;
  const changed = terms.filter((t) => t.v2 && t.v2 !== t.v1).length;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-xl border bg-card p-0.5">
            {versions.map((x) => (
              <button
                key={x.n}
                onClick={() => setVersion(x.n)}
                className={cn("rounded-[10px] px-3 py-1.5 text-[12.5px] font-medium transition", v === x.n ? "bg-ink text-white" : "text-muted-foreground hover:text-ink")}
              >
                {x.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Download /> Export PDF
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="outline" size="sm" disabled>
                    <Send /> Send via DocuSign
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>DocuSign integration is planned for the closing phase.</TooltipContent>
            </Tooltip>
            {isHero && v === 2 && (
              <Button
                size="sm"
                disabled={!canEdit}
                onClick={() => {
                  log({ at: nowIso(), actor: persona, action: "termsheet.issued", entityType: "TermSheet", entityId: deal.id, entityLabel: `${deal.name} · Term sheet v2`, after: `${changed} terms changed vs v1`, reason: "Post-appraisal update" });
                  toast.success("Term sheet v2 issued", { description: "Version locked; v1 retained for history." });
                }}
              >
                <FilePenLine /> Issue v2
              </Button>
            )}
          </div>
        </div>

        <article className="print-area paper mx-auto max-w-[820px] rounded-sm bg-white px-8 py-10 md:px-14">
          <div className="flex items-start justify-between border-b-2 border-ink pb-4">
            <div>
              <div className="font-display text-[22px] font-semibold tracking-[0.12em] text-ink">TIKOVA</div>
              <div className="text-[11px] text-muted-foreground">2850 Quarry Lake Dr, Suite 160 · Pikesville, MD 21209</div>
            </div>
            <div className="text-right text-[11px] text-muted-foreground">
              <div className="font-semibold uppercase tracking-wider text-ink">Summary of terms</div>
              <div>{versions.find((x) => x.n === v)?.label} · {date(versions.find((x) => x.n === v)?.at ?? "2026-10-27")}</div>
            </div>
          </div>
          <p className="mt-5 text-[12.5px] leading-relaxed text-ink/80">
            Re: {deal.name}, {deal.address}, {deal.city}, {deal.state}. This summary of terms is non-binding and subject to
            satisfactory due diligence, credit committee approval and definitive loan documentation.
          </p>
          <table className="mt-5 w-full text-[12.5px]">
            <tbody>
              {terms.map((t) => {
                const isChanged = v === 2 && t.v2 && t.v2 !== t.v1;
                return (
                  <tr key={t.k} className={cn("border-b align-top", isChanged && "bg-brand-soft/60")}>
                    <td className="w-44 py-2.5 pr-4 font-semibold text-ink">
                      {t.k}
                      {isChanged && <span className="ml-1.5 rounded bg-brand px-1 text-[9.5px] font-bold uppercase text-white">changed</span>}
                    </td>
                    <td className="py-2.5 text-ink/85">
                      {v === 2 && t.v2 ? t.v2 : t.v1}
                      {isChanged && <div className="mt-1 text-[11.5px] text-muted-foreground line-through">{t.v1}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-10 grid grid-cols-2 gap-10 text-[11.5px] text-muted-foreground">
            <div className="border-t pt-2">Accepted by Borrower</div>
            <div className="border-t pt-2">Tikova</div>
          </div>
        </article>
      </div>

      <div className="no-print space-y-5">
        <Panel title="Versions" bodyClassName="p-2">
          {versions.map((x) => (
            <button key={x.n} onClick={() => setVersion(x.n)} className={cn("flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-muted/50", v === x.n && "bg-muted/60")}>
              <span>
                <span className="block text-[13px] font-medium text-ink">{x.label}</span>
                <span className="text-[11px] text-muted-foreground">{date(x.at)}</span>
              </span>
              <Pill tone={x.status === "Draft" ? "soft" : x.status === "Not issued" ? "neutral" : "pass"}>{x.status}</Pill>
            </button>
          ))}
          {isHero && <div className="px-3 pb-2 pt-1 text-[11.5px] text-muted-foreground">{changed} terms changed in v2 · highlighted</div>}
        </Panel>
        {isHero && (
          <Panel title="Internal: capital allocation" icon={Lock} description="Not shown to borrower">
            <div className="flex h-2.5 overflow-hidden rounded-full">
              <div className="w-[70%] bg-ink" />
              <div className="w-[30%] bg-brand" />
            </div>
            <div className="mt-3 space-y-1.5 text-[12.5px]">
              <div className="flex justify-between"><span>Tikova Credit Fund I</span><span className="font-semibold tnum">70% · {money(5_915_000)}</span></div>
              <div className="flex justify-between"><span>Bayline Bank (participation)</span><span className="font-semibold tnum">30% · {money(2_535_000)}</span></div>
            </div>
            <p className="mt-3 text-[11.5px] text-muted-foreground">Bayline share subject to exception approval (soft buy-box misses). Tikova remains lead lender and servicer.</p>
          </Panel>
        )}
      </div>
    </div>
  );
}
