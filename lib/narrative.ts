// Narrative drafts that Claude would produce from APPROVED data. In the real
// system these come from the model; numbers are never written by the model —
// they are tokens ({{...}}) that code fills from the chosen underwriting run.
import type { Deal } from "@/lib/types";
import { SPONSOR, BROKER } from "@/lib/data/relationships";

export interface Insight {
  tone: "pass" | "soft" | "fail" | "info";
  title: string;
  body: string;
  href?: string;
}

export function dealInsights(deal: Deal): Insight[] {
  if (deal.id === "harborview") {
    return [
      {
        tone: "soft",
        title: "2BR pro forma rent exceeds appraisal",
        body: "Sponsor underwrites $2,240/mo vs. Brightline's concluded $2,150 (+4.2%, above the 3% tolerance). Sizing uses the lesser-of NOI policy, so the appraisal figure governs.",
        href: "/deals/harborview/documents/hv-appraisal",
      },
      {
        tone: "soft",
        title: "T-12 includes $14,250 of capital expense",
        body: "Note 3 discloses roof-replacement amortization inside R&M. Reclassified below NOI; normalized T-12 NOI is $418,917 vs. $404,667 reported. Needs reviewer confirmation.",
        href: "/deals/harborview/documents/hv-t12",
      },
      {
        tone: "fail",
        title: "Phase I ESA not received; PFS is 210 days old",
        body: "Atlas SMA screening stays incomplete until the ESA arrives. The sponsor PFS (3/31/2026) exceeds the 180-day policy; request an updated statement before committee.",
        href: "/deals/harborview/documents",
      },
      {
        tone: "pass",
        title: "Sized within Fund I policy, DSCR binding",
        body: "At the 6.00% / 30-yr take-out test the deal supports up to ~$8.62MM; the $8.45MM request leaves ~$173K of headroom. A +25 bp take-out rate breaches the 1.20x DSCR floor.",
        href: "/deals/harborview/sizing",
      },
    ];
  }
  const sponsor = SPONSOR[deal.sponsorId];
  const list: Insight[] = [
    {
      tone: "info",
      title: `${deal.productType} · ${deal.assetType}`,
      body: `${sponsor?.name ?? "Sponsor"} is requesting a ${deal.termMonths}-month ${deal.productType.toLowerCase()} loan for ${deal.name} in ${deal.submarket}, ${deal.city}. Sourced via ${BROKER[deal.brokerId]?.firm ?? "direct"}.`,
    },
  ];
  if (!deal.hasPhaseOneEsa) list.push({ tone: "soft", title: "Phase I ESA outstanding", body: "Required by Atlas SMA before screening can complete." });
  if (deal.openFlags > 0) list.push({ tone: "soft", title: `${deal.openFlags} open review flag${deal.openFlags > 1 ? "s" : ""}`, body: "Extracted values awaiting underwriter confirmation." });
  if (deal.closeReason) list.push({ tone: "fail", title: "Closed", body: deal.closeReason });
  return list;
}

export interface MemoSection {
  key: string;
  title: string;
  kind: "ai" | "code";
  text?: string;
}

/** Credit memo narrative sections. Tokens like {{loan}} are filled by code. */
export function memoNarrative(deal: Deal): Record<string, string> {
  const sponsor = SPONSOR[deal.sponsorId];
  if (deal.id === "harborview") {
    return {
      summary:
        "Tikova is asked to provide a {{loan}} senior floating-rate bridge loan to Harborview Lofts Owner LLC to acquire and renovate a 64-unit, 1924-vintage warehouse conversion in Canton, Baltimore. The loan comprises a {{initial}} initial advance and {{future}} of future funding for a 40-unit interior program, amenity and exterior work. The business plan raises in-place rents ({{avgInPlace}} average) toward renovated comparables and stabilizes the asset within 24 months.",
      recommendation:
        "Underwriting recommends approval of {{loan}} subject to the conditions below. The loan sizes within Tikova Credit Fund I policy with DSCR as the binding constraint ({{maxLoan}} maximum, {{headroom}} headroom). Proposed hold: Fund I 70% with a 30% Bayline participation, contingent on an exception for Bayline's recourse and leverage preferences.",
      property:
        "The property is a four-story brick loft building converted to apartments in 2008, comprising 16 studios, 36 one-bedroom and 12 two-bedroom units ({{nrsf}} NRSF). In-place occupancy is {{occupancy}} with modest loss-to-lease. The renovation scope is supported by a GC walk-through and the Director of Construction's review; per-unit interior cost of $26,000 is in line with recent Canton renovations.",
      sponsor:
        "Calloway Street Partners (est. 2011) has delivered or repositioned ~640 units in Baltimore and is a repeat Tikova borrower. The principal reports net worth of {{netWorth}} and liquidity of {{liquidity}}, satisfying the 1.0x net worth and 10% liquidity tests. The personal financial statement is dated March 31, 2026 and must be refreshed before closing.",
      market:
        "Canton remains one of Baltimore's most liquid multifamily submarkets. Brightline's rent survey of five comparables supports concluded rents of $1,450 / $1,775 / $2,150 for studio, 1BR and 2BR units. Four sales comparables from 2025–2026 trade between $143,750 and $157,955 per unit at 5.31%–5.78% cap rates, bracketing the subject's as-stabilized value.",
      risks:
        "1) Lease-up and rent risk: the sponsor's 2BR rent exceeds the appraisal by 4.2%; mitigated by sizing to the lesser-of NOI. 2) Execution risk on a 1920s building; mitigated by an 8% renovation contingency, completion guaranty and monthly inspections. 3) Interest-rate risk: DSCR fails at a +25 bp take-out rate; mitigated by a required interest-rate cap and 24-month term with two extensions subject to DSCR and debt-yield tests. 4) Carry: the interest reserve covers ~104% of projected shortfall, a thin margin; consider sizing the reserve to 110%.",
      conditions:
        "• Receipt and satisfactory review of Phase I ESA\n• Updated sponsor PFS dated within 180 days\n• Interest-rate cap (strike ≤ 5.50% SOFR) for the initial term\n• Completion guaranty and 25% repayment guaranty from principal\n• Bayline participation subject to exception approval",
    };
  }
  return {
    summary: `Tikova is asked to provide a {{loan}} ${deal.productType.toLowerCase()} loan to ${deal.borrowerEntity} for ${deal.name}, a ${deal.assetType.toLowerCase()} asset in ${deal.submarket}, ${deal.city}, ${deal.state}. The sponsor is ${sponsor?.name}.`,
    recommendation: `Underwriting recommends approval of {{loan}} subject to standard conditions. The deal sizes within policy with {{binding}} as the binding constraint.`,
    property: `${deal.name} is a ${deal.assetType.toLowerCase()} property${deal.units ? ` with ${deal.units} units` : ""}${deal.sqft ? ` totaling ${deal.sqft.toLocaleString("en-US")} SF` : ""} located at ${deal.address}.`,
    sponsor: `${sponsor?.name} (est. ${sponsor?.founded}) reports net worth of {{netWorth}} and liquidity of {{liquidity}}.`,
    market: `${deal.submarket} is an established Mid-Atlantic submarket. Market commentary will be drafted from the approved appraisal once extracted.`,
    risks: "1) Business-plan execution. 2) Interest-rate risk at take-out. 3) Market rent and absorption assumptions.",
    conditions: "• Satisfactory third-party reports\n• Standard guaranties and carve-outs\n• Interest-rate cap for initial term",
  };
}
