"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { DealDocument } from "@/lib/types";
import {
  APPRAISAL,
  BUDGET_LINES,
  BUDGET_TOTAL,
  PFS,
  RENT_ROLL,
  RENT_ROLL_SUMMARY as RR,
  ROOF_AMORTIZATION,
  SOURCES,
  T12_LINES,
  T12_MONTHS,
  T12_TOTALS,
  TOTAL_USES,
  USES,
} from "@/lib/data/harborview";
import { int, money } from "@/lib/format";

/* ----------------------------- Anchors --------------------------------- */

export const AnchorContext = React.createContext<string | null>(null);

export function A({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const active = React.useContext(AnchorContext) === id;
  return (
    <span data-anchor={id} className={cn("rounded-[3px] px-0.5 transition-all duration-300", active && "anchor-hit", className)}>
      {children}
    </span>
  );
}

const n0 = (v: number) => int(v);
const neg = (v: number) => `(${int(v)})`;

/* ------------------------------ Page ----------------------------------- */

export function Page({
  n,
  total,
  children,
  header,
  footer,
  className,
  scan,
}: {
  n: number;
  total: number;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  scan?: boolean;
}) {
  return (
    <div id={`page-${n}`} data-page={n} className="scroll-mt-4">
      <div className="mb-1.5 flex items-center justify-between px-1 text-[10.5px] text-muted-foreground">
        <span>Page {n}</span>
        <span>of {total}</span>
      </div>
      <div
        className={cn(
          "paper relative mx-auto w-full overflow-hidden bg-white text-[#1d1d1f]",
          scan ? "rotate-[0.25deg] bg-[#fbfaf6] [filter:grayscale(0.2)_contrast(1.05)]" : "",
          className,
        )}
      >
        {scan && (
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, #000 0.5px, transparent 0.6px), radial-gradient(circle at 70% 80%, #000 0.5px, transparent 0.6px)",
              backgroundSize: "7px 7px, 11px 11px",
            }}
          />
        )}
        {header}
        <div className="relative px-8 py-7">{children}</div>
        {footer}
      </div>
    </div>
  );
}

/* ----------------------------- Rent roll ------------------------------- */

const RR_HEADERS = ["Unit #", "Flr Plan", "SF", "Resident", "Status", "Move-In", "Lease Exp", "Mkt Rent", "Lease Rent", "Dep Held"];

function fmtD(iso: string | null) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

function RentRollSheet({ rows, page, withTitle, withFooter }: { rows: typeof RENT_ROLL; page: number; withTitle?: boolean; withFooter?: boolean }) {
  const startRow = withTitle ? 1 : 38;
  let r = startRow;
  return (
    <Page n={page} total={2} className="font-mono text-[10px]">
      <div className="-mx-8 -my-7">
        <div className="flex border-b bg-[#f3f3f3] text-[9.5px] text-[#666]">
          <div className="w-8 border-r py-0.5 text-center"> </div>
          {"ABCDEFGHIJ".split("").map((c) => (
            <div key={c} className="flex-1 border-r py-0.5 text-center last:border-0">
              {c}
            </div>
          ))}
        </div>
        {withTitle && (
          <>
            <Row n={r++} cells={["Harbor Residential Management — Rent Roll (Yardi export)"]} bold />
            <Row n={r++} cells={["Property: Harborview Lofts (hvl01)"]} />
            <Row n={r++} cells={[<A key="a" id="rr.asof">Rent Roll as of 09/30/2026</A>]} />
            <Row n={r++} cells={[""]} />
            <Row n={r++} cells={RR_HEADERS} header />
            <Row
              n={r++}
              cells={["100", <A key="o" id="rr.office">LEASING OFFICE</A>, "640", "(non-revenue)", "Model", "", "", "0", "0", "0"]}
              muted
            />
          </>
        )}
        {!withTitle && <Row n={r++} cells={RR_HEADERS} header />}
        {rows.map((u) => (
          <Row
            key={u.unit}
            n={r++}
            cells={[
              u.unit,
              u.type,
              String(u.sqft),
              u.tenant,
              u.status,
              fmtD(u.leaseStart),
              fmtD(u.leaseEnd),
              n0(u.marketRent),
              n0(u.contractRent),
              n0(u.deposit),
            ]}
            vacant={u.status === "Vacant"}
          />
        ))}
        {withFooter && (
          <div className="border-t-2 border-[#333] bg-[#fafafa] px-10 py-3 text-[10.5px] leading-6">
            <div className="grid grid-cols-2 gap-x-8">
              <span><A id="rr.units">Total Units: {RR.totalUnits}</A></span>
              <span><A id="rr.contract">Lease Rent total {money(RR.monthlyContractRent)}</A></span>
              <span><A id="rr.occupied">Occupied: {RR.occupiedUnits}</A> · Vacant: {RR.totalUnits - RR.occupiedUnits}</span>
              <span><A id="rr.avg">Avg Lease Rent {money(RR.avgContractRent)}</A></span>
              <span><A id="rr.occ">Occupancy {(RR.occupancy * 100).toFixed(1)}%</A></span>
              <span><A id="rr.market">Avg Mkt Rent {money(RR.avgMarketRent)}</A></span>
              <span className="col-span-2"><A id="rr.expiring">{RR.expiringSixMonths} leases expire on or before 03/31/2027</A></span>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}

function Row({ n, cells, header, bold, muted, vacant }: { n: number; cells: React.ReactNode[]; header?: boolean; bold?: boolean; muted?: boolean; vacant?: boolean }) {
  const single = cells.length === 1;
  return (
    <div className={cn("flex border-b border-[#e8e8e8]", header && "bg-[#1f4e79] text-white", muted && "text-[#999]", vacant && "bg-[#fff8e6]")}>
      <div className="w-8 shrink-0 border-r border-[#e8e8e8] bg-[#f3f3f3] py-[3px] text-center text-[9px] text-[#888]">{n}</div>
      {single ? (
        <div className={cn("flex-1 px-1.5 py-[3px]", bold && "font-bold")}>{cells[0]}</div>
      ) : (
        cells.map((c, i) => (
          <div key={i} className={cn("flex-1 truncate border-r border-[#efefef] px-1.5 py-[3px] last:border-0", i >= 7 && "text-right", header && "font-semibold")}>
            {c}
          </div>
        ))
      )}
    </div>
  );
}

function RentRollDoc() {
  return (
    <>
      <RentRollSheet rows={RENT_ROLL.slice(0, 32)} page={1} withTitle />
      <RentRollSheet rows={RENT_ROLL.slice(32)} page={2} withFooter />
    </>
  );
}

/* -------------------------------- T-12 --------------------------------- */

function T12Doc() {
  const inc = T12_LINES.filter((l) => l.section === "income");
  const exp = T12_LINES.filter((l) => l.section === "expense");
  const egiMonthly = T12_MONTHS.map((_, i) => inc.reduce((a, l) => a + l.sign * l.monthly[i], 0));
  const opexMonthly = T12_MONTHS.map((_, i) => exp.reduce((a, l) => a + l.monthly[i], 0));
  const anchor: Record<string, string> = { gpr: "t12.gpr", vac: "t12.vac", rm: "t12.rm" };
  const Line = ({ l }: { l: (typeof T12_LINES)[number] }) => (
    <tr className="border-b border-[#eee]">
      <td className="whitespace-nowrap py-[3px] pr-2">{l.label}</td>
      {l.monthly.map((v, i) => (
        <td key={i} className="px-1 text-right tnum">{l.sign < 0 ? neg(v) : n0(v)}</td>
      ))}
      <td className="pl-2 text-right font-semibold tnum">
        {anchor[l.key] ? <A id={anchor[l.key]}>{l.sign < 0 ? neg(l.annual) : n0(l.annual)}</A> : l.sign < 0 ? neg(l.annual) : n0(l.annual)}
      </td>
    </tr>
  );
  return (
    <>
      <Page n={1} total={2} className="text-[8.5px]">
        <div className="text-center">
          <div className="text-[13px] font-bold tracking-wide">HARBORVIEW LOFTS</div>
          <div className="text-[10px]">Statement of Operations — 12 Month Trailing</div>
          <div className="text-[9.5px] text-[#555]">
            <A id="t12.period">For the twelve months ended September 30, 2026</A> · Cash basis
          </div>
        </div>
        <div className="-mx-2 mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[#333] text-[8px] uppercase text-[#444]">
                <th className="py-1 text-left">Account</th>
                {T12_MONTHS.map((m) => (
                  <th key={m} className="px-1 text-right font-semibold">{m}</th>
                ))}
                <th className="pl-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={14} className="pt-2 font-bold">INCOME</td></tr>
              {inc.slice(0, 4).map((l) => <Line key={l.key} l={l} />)}
              <tr><td colSpan={14} className="pt-1.5 text-[#555]">Other Income</td></tr>
              {inc.slice(4).map((l) => <Line key={l.key} l={l} />)}
              <tr className="border-b border-[#ccc] italic">
                <td className="py-[3px]">Total Other Income</td>
                {T12_MONTHS.map((_, i) => <td key={i} className="px-1 text-right tnum">{n0(inc.slice(4).reduce((a, l) => a + l.monthly[i], 0))}</td>)}
                <td className="pl-2 text-right font-semibold tnum"><A id="t12.other">{n0(T12_TOTALS.otherIncome)}</A></td>
              </tr>
              <tr className="border-y-2 border-[#333] font-bold">
                <td className="py-1">EFFECTIVE GROSS INCOME</td>
                {egiMonthly.map((v, i) => <td key={i} className="px-1 text-right tnum">{n0(v)}</td>)}
                <td className="pl-2 text-right tnum"><A id="t12.egi">{n0(T12_TOTALS.egi)}</A></td>
              </tr>
              <tr><td colSpan={14} className="pt-3 font-bold">OPERATING EXPENSES</td></tr>
              {exp.map((l) => <Line key={l.key} l={l} />)}
              <tr className="border-y-2 border-[#333] font-bold">
                <td className="py-1">TOTAL OPERATING EXPENSES</td>
                {opexMonthly.map((v, i) => <td key={i} className="px-1 text-right tnum">{n0(v)}</td>)}
                <td className="pl-2 text-right tnum"><A id="t12.opex">{n0(T12_TOTALS.opexReported)}</A></td>
              </tr>
              <tr className="font-bold">
                <td className="py-1.5">NET OPERATING INCOME</td>
                {egiMonthly.map((v, i) => <td key={i} className="px-1 text-right tnum">{n0(v - opexMonthly[i])}</td>)}
                <td className="pl-2 text-right tnum"><A id="t12.noi">{n0(T12_TOTALS.noiReported)}</A></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-[8px] text-[#666]">See accompanying notes. Prepared by Harbor Residential Management, unaudited.</div>
      </Page>
      <Page n={2} total={2} className="text-[11px] leading-relaxed">
        <div className="text-[13px] font-bold">Notes to Statement of Operations</div>
        <ol className="mt-3 list-decimal space-y-3 pl-4">
          <li><b>Basis of presentation.</b> The statement is prepared on the cash basis and has not been audited or reviewed.</li>
          <li><b>Management fee.</b> Harbor Residential Management is paid 4.0% of collected revenue under an agreement dated January 1, 2022.</li>
          <li>
            <b>Repairs &amp; maintenance.</b>{" "}
            <A id="t12.note3">
              Repairs &amp; Maintenance includes ${int(ROOF_AMORTIZATION)} representing amortization of the 2024 roof replacement
            </A>{" "}
            (total cost $171,000, amortized over 12 years).
          </li>
          <li><b>Concessions.</b> One-time move-in concessions were offered on 14 leases signed between November 2025 and February 2026.</li>
          <li><b>Real estate taxes</b> reflect the 2025/26 Baltimore City assessment and are expected to be reassessed upon sale.</li>
        </ol>
      </Page>
    </>
  );
}

/* ------------------------------- Budget -------------------------------- */

function BudgetDoc() {
  const anchors: Record<string, string> = { interiors: "bud.interiors", common: "bud.common", exterior: "bud.exterior", contingency: "bud.cont" };
  const usesAnchor: Record<string, string> = { "Interest reserve": "bud.reserve" };
  return (
    <>
      <Page
        n={1}
        total={2}
        className="text-[11.5px]"
        header={<div className="h-1.5 bg-[#2b4c3f]" />}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[15px] font-bold text-[#2b4c3f]">Calloway Street Partners</div>
            <div className="text-[10px] text-[#666]">Renovation Budget — Harborview Lofts · Version 3 · 10/08/2026</div>
          </div>
          <div className="rounded border border-[#2b4c3f] px-2 py-0.5 text-[9.5px] font-semibold text-[#2b4c3f]">GC: Pierce &amp; Lowe Builders</div>
        </div>
        <table className="mt-6 w-full">
          <thead>
            <tr className="border-b-2 border-[#2b4c3f] text-left text-[10px] uppercase text-[#2b4c3f]">
              <th className="py-1.5">Line item</th>
              <th>Category</th>
              <th className="text-right">Amount</th>
              <th className="text-right">% of total</th>
            </tr>
          </thead>
          <tbody>
            {BUDGET_LINES.map((l) => (
              <tr key={l.key} className="border-b border-[#eee]">
                <td className="py-2">{anchors[l.key] ? <A id={anchors[l.key]}>{l.label}</A> : l.label}</td>
                <td className="text-[#666]">{l.category}</td>
                <td className="text-right tnum">{n0(l.amount)}</td>
                <td className="text-right text-[#666] tnum">{((l.amount / BUDGET_TOTAL) * 100).toFixed(1)}%</td>
              </tr>
            ))}
            <tr className="border-t-2 border-[#2b4c3f] font-bold">
              <td className="py-2" colSpan={2}>
                <A id="bud.total">TOTAL RENOVATION BUDGET</A>
              </td>
              <td className="text-right tnum">${n0(BUDGET_TOTAL)}</td>
              <td className="text-right tnum">100.0%</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-6 grid grid-cols-3 gap-3 text-[10.5px]">
          <div className="rounded border p-2.5"><div className="text-[#666]">Units renovated</div><div className="font-bold"><A id="bud.units">40 of 64</A></div></div>
          <div className="rounded border p-2.5"><div className="text-[#666]">Interior cost / unit</div><div className="font-bold">$26,000</div></div>
          <div className="rounded border p-2.5"><div className="text-[#666]">Schedule</div><div className="font-bold">12 months (rolling)</div></div>
        </div>
        <p className="mt-5 text-[10px] text-[#666]">
          Scope includes kitchens (quartz, stainless appliances), LVP flooring, in-unit W/D in 2BR units, bath refresh, lobby and fitness
          amenity, roof membrane replacement over the east wing, and window replacement on the Boston Street elevation.
        </p>
      </Page>
      <Page n={2} total={2} className="text-[11.5px]" header={<div className="h-1.5 bg-[#2b4c3f]" />}>
        <div className="text-[15px] font-bold text-[#2b4c3f]">Sources &amp; Uses</div>
        <div className="mt-5 grid grid-cols-2 gap-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[#2b4c3f] text-left text-[10px] uppercase text-[#2b4c3f]"><th className="py-1.5">Uses</th><th className="text-right">Amount</th></tr>
            </thead>
            <tbody>
              {USES.map((u) => (
                <tr key={u.label} className="border-b border-[#eee]">
                  <td className="py-1.5">{usesAnchor[u.label] ? <A id={usesAnchor[u.label]}>{u.label} {n0(u.amount)}</A> : u.label}</td>
                  <td className="text-right tnum">{usesAnchor[u.label] ? "" : n0(u.amount)}</td>
                </tr>
              ))}
              <tr className="font-bold"><td className="py-2"><A id="bud.uses">TOTAL USES ${n0(TOTAL_USES)}</A></td><td /></tr>
            </tbody>
          </table>
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[#2b4c3f] text-left text-[10px] uppercase text-[#2b4c3f]"><th className="py-1.5">Sources</th><th className="text-right">Amount</th></tr>
            </thead>
            <tbody>
              {SOURCES.map((s, i) => (
                <tr key={s.label} className="border-b border-[#eee]">
                  <td className="py-1.5">{i === 2 ? <A id="bud.equity">Sponsor cash equity {n0(s.amount)}</A> : s.label}</td>
                  <td className="text-right tnum">{i === 2 ? "" : n0(s.amount)}</td>
                </tr>
              ))}
              <tr className="font-bold"><td className="py-2">TOTAL SOURCES</td><td className="text-right tnum">${n0(TOTAL_USES)}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-[10px] text-[#666]">Loan figures reflect the lender&apos;s indicative terms dated 10/06/2026 and remain subject to final approval.</p>
      </Page>
    </>
  );
}

/* ------------------------------ Appraisal ------------------------------ */

function ApprHeader() {
  return (
    <div className="flex items-center justify-between border-b px-8 py-2.5 text-[9.5px] text-[#666]">
      <span className="font-semibold tracking-[0.18em] text-[#16324f]">BRIGHTLINE VALUATION ADVISORS</span>
      <span>Harborview Lofts · 2815 Harborview Way, Baltimore, MD</span>
    </div>
  );
}
function ApprFooter({ n }: { n: number }) {
  return (
    <div className="flex justify-between border-t px-8 py-2 text-[9px] text-[#888]">
      <span>File No. BVA-26-1187</span>
      <span>Page {n} of 142</span>
    </div>
  );
}

function AppraisalDoc() {
  const vals = [
    { label: "As Is", date: "September 18, 2026", value: APPRAISAL.asIs, a: "appr.asis" },
    { label: "Prospective As Complete", date: "September 1, 2027", value: APPRAISAL.asComplete, a: "appr.ascomplete" },
    { label: "Prospective As Stabilized", date: "September 1, 2028", value: APPRAISAL.asStabilized, a: "appr.asstab" },
  ];
  return (
    <>
      <Page n={1} total={142} header={<ApprHeader />} footer={<ApprFooter n={1} />} className="text-[11.5px] leading-relaxed">
        <div className="text-[10.5px] text-[#666]">October 22, 2026</div>
        <div className="mt-3 text-[10.5px]">Tikova — Credit Department<br />2850 Quarry Lake Dr, Suite 160<br />Pikesville, MD 21209</div>
        <div className="mt-4 font-semibold">RE: Appraisal of Harborview Lofts, a 64-unit multifamily property, 2815 Harborview Way, Baltimore, Maryland</div>
        <p className="mt-3">
          At your request, we have prepared an appraisal of the fee simple interest in the referenced property, <A id="appr.effdate">effective September 18, 2026</A>,
          the date of our inspection. The analysis considers the subject&apos;s current condition and the sponsor&apos;s proposed renovation program.
          Based on the analysis contained in the following report, our opinions of value are:
        </p>
        <table className="mt-4 w-full border text-[11px]">
          <thead className="bg-[#16324f] text-white"><tr><th className="p-1.5 text-left">Value premise</th><th className="text-left">Date</th><th className="pr-2 text-right">Value</th></tr></thead>
          <tbody>
            {vals.map((v) => (
              <tr key={v.label} className="border-t"><td className="p-1.5">{v.label}</td><td>{v.date}</td><td className="pr-2 text-right font-semibold tnum">{money(v.value)}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-[10px] text-[#666]">Extraordinary assumption: the prospective values assume completion of the renovation scope as described in the sponsor budget (v3) in a workmanlike manner.</p>
      </Page>

      <Page n={4} total={142} header={<ApprHeader />} footer={<ApprFooter n={4} />} className="text-[11.5px]">
        <div className="text-[14px] font-bold text-[#16324f]">Summary of Salient Facts</div>
        <table className="mt-3 w-full text-[11px]">
          <tbody>
            {[
              ["Property name", "Harborview Lofts"],
              ["Property type", "Multifamily — loft conversion (mid-rise)"],
              ["Property Rights Appraised", <A key="i" id="appr.interest">Property Rights Appraised: Fee Simple</A>],
              ["Year built / converted", "1924 / 2008"],
              ["Units", "64 (16 studio · 36 one-bedroom · 12 two-bedroom)"],
              ["Net rentable area", `${int(RR.totalSqft)} SF`],
              ["Occupancy", <A key="o" id="appr.occ">Occupancy (as of inspection): 89%</A>],
              ["Zoning", "C-2, Community Commercial — legal conforming"],
              ["Flood zone", "Zone X (shaded) — outside 100-year floodplain"],
              ["Highest & best use (as improved)", "Continued multifamily use with renovation"],
            ].map(([k, v], i) => (
              <tr key={i} className="border-b"><td className="w-56 py-1.5 text-[#555]">{k}</td><td className="py-1.5">{v}</td></tr>
            ))}
          </tbody>
        </table>
      </Page>

      <Page n={64} total={142} header={<ApprHeader />} footer={<ApprFooter n={64} />} className="text-[11px]">
        <div className="text-[14px] font-bold text-[#16324f]">Market Rent Conclusions</div>
        <p className="mt-2 text-[10.5px] text-[#555]">Comparable rents surveyed September 2026; adjusted for condition, unit size and amenities.</p>
        <table className="mt-3 w-full text-[10.5px]">
          <thead className="border-b-2 border-[#16324f] text-left"><tr><th className="py-1">Comparable</th><th>Dist.</th><th>Built</th><th className="text-right">Studio</th><th className="text-right">1BR</th><th className="text-right">2BR</th></tr></thead>
          <tbody>
            {APPRAISAL.rentComps.map((c) => (
              <tr key={c.name} className="border-b"><td className="py-1">{c.name}</td><td>{c.distance}</td><td>{c.built}</td><td className="text-right tnum">{n0(c.studio)}</td><td className="text-right tnum">{n0(c.one)}</td><td className="text-right tnum">{n0(c.two)}</td></tr>
            ))}
            <tr className="border-t-2 border-[#16324f] bg-[#f2f6fa] font-semibold">
              <td className="py-1.5" colSpan={3}>Concluded market rent (renovated)</td>
              <td className="text-right tnum">{n0(APPRAISAL.concludedRents.Studio)}</td>
              <td className="text-right tnum"><A id="appr.rent1">1BR/1BA concluded ${n0(APPRAISAL.concludedRents["1BR/1BA"])}/mo</A></td>
              <td className="text-right tnum"><A id="appr.rent2">2BR/2BA concluded ${n0(APPRAISAL.concludedRents["2BR/2BA"])}/mo</A></td>
            </tr>
          </tbody>
        </table>
      </Page>

      <Page n={87} total={142} header={<ApprHeader />} footer={<ApprFooter n={87} />} className="text-[11.5px]">
        <div className="text-[14px] font-bold text-[#16324f]">Income Capitalization Approach — Direct Capitalization (As Stabilized)</div>
        <table className="mt-4 w-full">
          <tbody>
            {[
              ["Potential gross income", n0(1_428_500)],
              ["Less: vacancy & credit loss (6.0%)", neg(85_900)],
              ["Effective gross income", n0(APPRAISAL.egi)],
              ["Less: operating expenses incl. reserves", neg(APPRAISAL.expenses)],
            ].map(([k, v]) => (
              <tr key={k} className="border-b"><td className="py-1.5">{k}</td><td className="text-right tnum">{v}</td></tr>
            ))}
            <tr className="border-b-2 border-[#16324f] font-bold"><td className="py-2"><A id="appr.noi">Net Operating Income ${n0(APPRAISAL.noi)}</A></td><td /></tr>
            <tr className="border-b"><td className="py-1.5"><A id="appr.cap">Overall Capitalization Rate 5.75%</A></td><td /></tr>
            <tr className="font-bold"><td className="py-2">Indicated value (rounded)</td><td className="text-right tnum">{money(APPRAISAL.asStabilized)}</td></tr>
          </tbody>
        </table>
        <p className="mt-4 text-[10.5px] text-[#555]">
          The overall rate is supported by four sales of comparable Baltimore multifamily assets (5.31%–5.78%) and investor surveys for
          Class B+ urban product. A rate toward the middle of the range is appropriate given the subject&apos;s renovation and location.
        </p>
      </Page>

      <Page n={112} total={142} header={<ApprHeader />} footer={<ApprFooter n={112} />} className="text-[11.5px]">
        <div className="text-[14px] font-bold text-[#16324f]">Reconciliation and Final Value Conclusions</div>
        <p className="mt-2 text-[10.5px] text-[#555]">Greatest weight is placed on the income capitalization approach, with support from the sales comparison approach.</p>
        <table className="mt-4 w-full border">
          <thead className="bg-[#16324f] text-white"><tr><th className="p-1.5 text-left">Premise</th><th className="text-left">Effective date</th><th className="pr-2 text-right">Final value</th></tr></thead>
          <tbody>
            {vals.map((v, i) => (
              <tr key={v.label} className="border-t">
                <td className="p-2">{v.label}</td>
                <td>{i === 2 ? <A id="appr.stabdate">as of September 1, 2028</A> : v.date}</td>
                <td className="pr-2 text-right font-bold tnum"><A id={v.a}>{money(v.value)}</A></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-[10.5px] text-[#555]">Exposure time: 6–9 months. Marketing time: 6–9 months.</p>
      </Page>
    </>
  );
}

/* --------------------------------- PFS --------------------------------- */

function PfsDoc() {
  const row = (k: string, v: React.ReactNode, b?: boolean) => (
    <div className={cn("flex justify-between border-b border-dashed border-[#bbb] py-1", b && "font-bold")}>
      <span>{k}</span>
      <span className="tnum">{v}</span>
    </div>
  );
  return (
    <>
      <Page n={1} total={2} scan className="font-mono text-[11px]">
        <div className="text-center text-[13px] font-bold tracking-wide">PERSONAL FINANCIAL STATEMENT</div>
        <div className="mt-1 text-center text-[10.5px]"><A id="pfs.date">Statement as of March 31, 2026</A></div>
        <div className="mt-4 grid grid-cols-2 gap-x-6 text-[10.5px]">
          <div>Name: Marcus Calloway</div>
          <div className="flex items-center gap-1">
            SSN: <span className="inline-block h-3.5 w-28 rounded-sm bg-[#111]" />
            <span className="rounded bg-[#d9922e] px-1 text-[8.5px] font-bold text-white">REDACTED</span>
          </div>
          <div>Address: on file</div>
          <div>Bank acct: ****4471 · ****9902</div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-8">
          <div>
            <div className="mb-1 font-bold underline">ASSETS</div>
            <A id="pfs.cash" className="block">
              {row("Cash in banks", "$1,315,000")}
              {row("Marketable securities", "$600,000")}
            </A>
            {row("Real estate (at ownership share)", n0(PFS.realEstateAtShare))}
            {row("Other assets", n0(PFS.otherAssets))}
            <div className="mt-1"><A id="pfs.assets">{row("TOTAL ASSETS", `$${n0(PFS.totalAssets)}`, true)}</A></div>
          </div>
          <div>
            <div className="mb-1 font-bold underline">LIABILITIES</div>
            {row("Notes payable", n0(1_220_000))}
            {row("Mortgage debt (at share)", n0(16_200_000))}
            <div className="mt-1"><A id="pfs.liab">{row("TOTAL LIABILITIES", `$${n0(PFS.totalLiabilities)}`, true)}</A></div>
            <div className="mt-4"><A id="pfs.nw">{row("NET WORTH", `$${n0(PFS.netWorth)}`, true)}</A></div>
          </div>
        </div>
        <div className="mt-6 border-t border-[#999] pt-2 text-[10.5px]">
          <A id="pfs.contingent">Contingent liabilities (loan guarantees) $22,600,000</A>
        </div>
        <div className="mt-6 text-[10px] italic">I certify the above is true and correct. — signed M.C. 04/12/2026</div>
      </Page>
      <Page n={2} total={2} scan className="font-mono text-[10.5px]">
        <div className="text-[12.5px] font-bold">SCHEDULE OF REAL ESTATE OWNED</div>
        <div className="text-[10px]"><A id="pfs.reo">{PFS.reo.length} properties listed</A></div>
        <table className="mt-3 w-full">
          <thead className="border-b border-[#555] text-left"><tr><th className="py-1">Property</th><th className="text-right">Own %</th><th className="text-right">Value</th><th className="text-right">Debt</th><th className="text-right">NOI</th></tr></thead>
          <tbody>
            {PFS.reo.map((r) => (
              <tr key={r.name} className="border-b border-dashed border-[#bbb]">
                <td className="py-1">{r.name}</td>
                <td className="text-right">{Math.round(r.own * 100)}%</td>
                <td className="text-right tnum">{n0(r.value)}</td>
                <td className="text-right tnum">{n0(r.debt)}</td>
                <td className="text-right tnum">{n0(r.noi)}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="py-1.5">TOTAL (100% basis)</td>
              <td />
              <td className="text-right tnum">{n0(PFS.reo.reduce((a, r) => a + r.value, 0))}</td>
              <td className="text-right tnum">{n0(PFS.reo.reduce((a, r) => a + r.debt, 0))}</td>
              <td className="text-right tnum">{n0(PFS.reo.reduce((a, r) => a + r.noi, 0))}</td>
            </tr>
          </tbody>
        </table>
      </Page>
    </>
  );
}

/* ------------------------------ Generic -------------------------------- */

function GenericDoc({ doc }: { doc: DealDocument }) {
  return (
    <Page n={1} total={Math.max(doc.pages, 1)} className="text-[12px]">
      <div className="text-[14px] font-bold">{doc.title}</div>
      <div className="mt-1 text-[11px] text-[#666]">{doc.fileName}</div>
      <div className="mt-6 space-y-2">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="h-2.5 rounded bg-[#eee]" style={{ width: `${60 + ((i * 37) % 40)}%` }} />
        ))}
      </div>
    </Page>
  );
}

export const PAGE_INDEX: Record<string, number[]> = {
  "hv-rentroll": [1, 2],
  "hv-t12": [1, 2],
  "hv-budget": [1, 2],
  "hv-appraisal": [1, 4, 64, 87, 112],
  "hv-pfs": [1, 2],
};

export function DocPages({ doc }: { doc: DealDocument }) {
  switch (doc.id) {
    case "hv-rentroll":
      return <RentRollDoc />;
    case "hv-t12":
      return <T12Doc />;
    case "hv-budget":
      return <BudgetDoc />;
    case "hv-appraisal":
      return <AppraisalDoc />;
    case "hv-pfs":
      return <PfsDoc />;
    default:
      return <GenericDoc doc={doc} />;
  }
}
