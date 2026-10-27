"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Clock,
  KanbanSquare,
  Landmark,
  Plus,
  ScanText,
  Sparkles,
  AlertTriangle,
  Gavel,
  FileWarning,
} from "lucide-react";
import { Bar as RBar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { useApp } from "@/lib/store";
import { PERSONA } from "@/lib/data/personas";
import { PARTNERS } from "@/lib/data/partners";
import { STAGES } from "@/lib/data/deals";
import { screenDeal, useCan, useMounted } from "@/lib/hooks";
import { daysBetween, money, moneyShort, relative } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  AssetTile,
  Bar,
  Panel,
  PersonaAvatar,
  SCREEN_TONE,
  Stat,
  StagePill,
  actorName,
} from "@/components/common/ui";
import { cn } from "@/lib/utils";

const ACTIVE = ["intake", "screening", "underwriting", "term_sheet", "committee"] as const;

function greeting() {
  return "Good afternoon";
}

export default function Dashboard() {
  const persona = useApp((s) => s.persona);
  const deals = useApp((s) => s.deals);
  const documents = useApp((s) => s.documents);
  const audit = useApp((s) => s.audit);
  const votes = useApp((s) => s.votes);
  const canCreate = useCan("deal.create");
  const mounted = useMounted();

  const active = deals.filter((d) => (ACTIVE as readonly string[]).includes(d.stage));
  const activeValue = active.reduce((a, d) => a + d.loanAmount, 0);
  const uw = deals.filter((d) => d.stage === "underwriting");
  const fieldsToReview = documents.reduce(
    (a, d) => a + (d.status === "needs_review" ? d.fields.filter((f) => f.status !== "approved" && f.status !== "rejected").length : 0),
    0,
  );
  const docsReady = documents.filter((d) => d.status === "ready").length;
  const available = PARTNERS.reduce((a, p) => a + (p.commitment - p.deployed - p.reserved), 0);
  const tsDays = deals
    .map((d) => {
      const ev = d.history.find((h) => h.to === "term_sheet");
      return ev ? daysBetween(d.createdAt, ev.at) : null;
    })
    .filter((x): x is number => x !== null);
  const avgDays = tsDays.length ? Math.round(tsDays.reduce((a, b) => a + b, 0) / tsDays.length) : 0;

  const byStage = STAGES.filter((s) => !s.terminal).map((s) => {
    const ds = deals.filter((d) => d.stage === s.id);
    return { stage: s.short, value: ds.reduce((a, d) => a + d.loanAmount, 0) / 1_000_000, count: ds.length };
  });

  const assetMix = Object.entries(
    active.reduce<Record<string, number>>((acc, d) => {
      acc[d.assetType] = (acc[d.assetType] ?? 0) + d.loanAmount;
      return acc;
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const MIX_COLORS = ["#0d0d0e", "#d9922e", "#6f6d66", "#b87518", "#a8a49b", "#3f3f46", "#e7c79a", "#d6d3cb"];

  const byState = Object.entries(
    active.reduce<Record<string, number>>((acc, d) => {
      acc[d.state] = (acc[d.state] ?? 0) + d.loanAmount;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const maxState = Math.max(...byState.map((x) => x[1]));

  const hv = deals.find((d) => d.id === "harborview");
  const hvDocs = documents.filter((d) => d.dealId === "harborview");
  const hvOpen = hvDocs.reduce((a, d) => a + (d.status === "needs_review" ? d.fields.filter((f) => f.status !== "approved").length : 0), 0);

  const committeePending = deals.filter((d) => d.stage === "committee" && !votes[d.id]?.[persona]);

  const attention = [
    hvOpen > 0 && {
      icon: ScanText,
      tone: "soft" as const,
      title: `${hvOpen} extracted fields need review`,
      sub: "Harborview Lofts · appraisal & T-12",
      href: "/deals/harborview/documents/hv-appraisal",
    },
    docsReady > 0 && {
      icon: Sparkles,
      tone: "brand" as const,
      title: `${docsReady} documents ready for AI extraction`,
      sub: "Includes scanned sponsor PFS (PII redacted)",
      href: "/review",
    },
    ...committeePending.map((d) => ({
      icon: Gavel,
      tone: "info" as const,
      title: `Committee vote pending: ${d.name}`,
      sub: `${moneyShort(d.loanAmount)} · ${d.productType}`,
      href: `/deals/${d.id}/committee`,
    })),
    {
      icon: FileWarning,
      tone: "fail" as const,
      title: "Phase I ESA outstanding",
      sub: "Harborview Lofts · blocks Atlas SMA screening",
      href: "/deals/harborview/documents",
    },
    {
      icon: AlertTriangle,
      tone: "soft" as const,
      title: "Sponsor PFS older than 180 days",
      sub: "Calloway Street Partners · dated Mar 31, 2026",
      href: "/deals/harborview/documents/hv-pfs",
    },
  ].filter(Boolean) as { icon: typeof ScanText; tone: "soft" | "brand" | "info" | "fail"; title: string; sub: string; href: string }[];

  const recent = [...audit].reverse().slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tuesday, October 27, 2026</div>
          <h1 className="mt-1 font-display text-[32px] font-semibold leading-tight text-ink">
            {greeting()}, {PERSONA[persona].title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {active.length} active deals · {moneyShort(activeValue)} in pipeline · {fieldsToReview} fields awaiting review
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" asChild>
            <Link href="/pipeline">
              <KanbanSquare /> Open pipeline
            </Link>
          </Button>
          {canCreate && (
            <Button size="lg" asChild>
              <Link href="/deals/new">
                <Plus /> New deal
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Guided demo hero */}
      {hv && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-grid-dark relative overflow-hidden rounded-3xl bg-ink p-6 text-white md:p-7"
        >
          <div className="absolute -right-24 -top-24 size-80 rounded-full bg-[radial-gradient(circle,rgba(217,146,46,0.45),transparent_65%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">Guided demo</span>
                {hv.code} · {hv.submarket}, {hv.city}
              </div>
              <h2 className="mt-3 font-display text-2xl font-semibold md:text-[28px]">
                Harborview Lofts: {moneyShort(hv.loanAmount)} value-add bridge, 64 units
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Follow one deal end-to-end: buy-box screening across four capital partners, Claude extraction with
                page-level evidence, deterministic sizing, a draft credit memo and committee approval.
              </p>
            </div>
            <div className="grid shrink-0 grid-cols-3 gap-2 text-center lg:w-[380px]">
              {[
                { k: "Fields to review", v: String(hvOpen) },
                { k: "Partner fits", v: `${screenDeal(hv).filter((r) => r.status === "pass").length}/4` },
                { k: "Binding limit", v: "DSCR" },
              ].map((x) => (
                <div key={x.k} className="rounded-2xl border border-white/10 bg-white/5 px-2 py-3">
                  <div className="font-display text-xl font-semibold text-white">{x.v}</div>
                  <div className="mt-0.5 text-[10.5px] text-zinc-400">{x.k}</div>
                </div>
              ))}
              <Link
                href="/deals/harborview"
                className="col-span-3 mt-1 flex h-10 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-ink transition hover:bg-[#e6a443]"
              >
                Open the deal <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Active pipeline" value={moneyShort(activeValue)} sub={`${active.length} deals across 5 stages`} icon={KanbanSquare} tone="brand" />
        <Stat label="In underwriting" value={uw.length} sub={moneyShort(uw.reduce((a, d) => a + d.loanAmount, 0)) + " requested"} icon={Banknote} />
        <Stat label="Fields awaiting review" value={fieldsToReview} sub={`${docsReady} documents ready to extract`} icon={ScanText} tone="soft" />
        <Stat label="Partner capital available" value={moneyShort(available)} sub="After deployed + reserved" icon={Landmark} tone="pass" />
        <Stat label="Avg. days to term sheet" value={avgDays} sub="Intake → term sheet issued" icon={Clock} className="col-span-2 lg:col-span-1" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Pipeline by stage */}
        <Panel
          title="Pipeline by stage"
          description="Requested loan amount, $MM"
          className="xl:col-span-2"
          actions={
            <Link href="/pipeline" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-ink">
              View board <ArrowUpRight className="size-3.5" />
            </Link>
          }
        >
          <div className="h-[230px]">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byStage} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                  <XAxis dataKey="stage" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#6f6d66" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8a8780" }} />
                  <RTooltip
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e6e3dc", fontSize: 12 }}
                    formatter={(v, _n, p) => [`$${Number(v).toFixed(2)}MM · ${(p.payload as { count: number }).count} deals`, "Requested"]}
                  />
                  <RBar dataKey="value" radius={[8, 8, 3, 3]} maxBarSize={56}>
                    {byStage.map((s, i) => (
                      <Cell key={s.stage} fill={i === 2 ? "#d9922e" : "#0d0d0e"} />
                    ))}
                  </RBar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        {/* Capital partners */}
        <Panel
          title="Capital partner capacity"
          description="Deployed · reserved · available"
          actions={
            <Link href="/capital-partners" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-ink">
              Partners <ArrowUpRight className="size-3.5" />
            </Link>
          }
        >
          <div className="space-y-4">
            {PARTNERS.map((p) => {
              const avail = p.commitment - p.deployed - p.reserved;
              return (
                <Link key={p.id} href={`/capital-partners/${p.id}`} className="block group">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-ink group-hover:underline">{p.name}</span>
                    <span className="text-muted-foreground tnum">{moneyShort(avail)} avail.</span>
                  </div>
                  <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-muted">
                    <div className="bg-ink" style={{ width: `${(p.deployed / p.commitment) * 100}%` }} />
                    <div className="bg-brand" style={{ width: `${(p.reserved / p.commitment) * 100}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>{p.type}</span>
                    <span className="tnum">{moneyShort(p.commitment)} commitment</span>
                  </div>
                </Link>
              );
            })}
            <div className="flex gap-4 pt-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-ink" /> Deployed</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-brand" /> Reserved (term sheets)</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-muted ring-1 ring-border" /> Available</span>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Attention */}
        <Panel title="Needs attention" description={`Tailored to ${PERSONA[persona].title}`} bodyClassName="p-2">
          <ul>
            {attention.map((a) => (
              <li key={a.title}>
                <Link href={a.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-muted/70">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg",
                      a.tone === "soft" && "bg-soft-soft text-soft",
                      a.tone === "brand" && "bg-brand-soft text-brand-strong",
                      a.tone === "info" && "bg-info-soft text-info",
                      a.tone === "fail" && "bg-fail-soft text-fail",
                    )}
                  >
                    <a.icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">{a.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{a.sub}</span>
                  </span>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Buy-box fit heat */}
        <Panel title="Buy-box fit across pipeline" description="Live screening vs. current buy-box versions" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b text-left text-[11px] text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Deal</th>
                  {PARTNERS.map((p) => (
                    <th key={p.id} className="px-1 py-2 text-center font-medium">{p.short.replace(" SMA", "")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {active.slice(0, 8).map((d) => {
                  const res = screenDeal(d);
                  return (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="max-w-[150px] truncate px-4 py-2">
                        <Link href={`/deals/${d.id}/screening`} className="font-medium text-ink hover:underline">{d.name}</Link>
                      </td>
                      {res.map((r) => (
                        <td key={r.partnerId} className="px-1 py-2 text-center">
                          <span
                            className={cn(
                              "inline-block size-3.5 rounded-[5px]",
                              SCREEN_TONE[r.status] === "pass" && "bg-pass",
                              SCREEN_TONE[r.status] === "soft" && "bg-soft/80",
                              SCREEN_TONE[r.status] === "fail" && "bg-fail/25",
                              SCREEN_TONE[r.status] === "info" && "bg-info/60",
                            )}
                            title={r.status}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-3 border-t px-4 py-2.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-pass" /> Pass</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-soft/80" /> Soft miss</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-info/60" /> Incomplete</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-fail/25" /> Hard fail</span>
          </div>
        </Panel>

        {/* Activity */}
        <Panel
          title="Recent activity"
          description="From the tamper-evident audit trail"
          bodyClassName="p-2"
          actions={
            <Link href="/audit" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-ink">
              Audit <ArrowUpRight className="size-3.5" />
            </Link>
          }
        >
          <ul>
            {recent.map((e) => (
              <li key={e.id} className="flex gap-3 rounded-xl px-3 py-2">
                <PersonaAvatar id={e.actor} size={26} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] text-ink">
                    <span className="font-medium">{actorName(e.actor)}</span>{" "}
                    <span className="text-muted-foreground">{e.action.split(".")[1].replace("_", " ")}</span>{" "}
                    <span className="font-medium">{e.entityLabel}</span>
                  </div>
                  {e.after && <div className="truncate text-[11.5px] text-muted-foreground">{e.after}</div>}
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{relative(e.at)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Asset mix" description="Active pipeline by requested amount">
          <div className="flex items-center gap-5">
            <div className="size-[150px] shrink-0">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={assetMix} dataKey="value" innerRadius={46} outerRadius={72} paddingAngle={2} stroke="none">
                      {assetMix.map((_, i) => (
                        <Cell key={i} fill={MIX_COLORS[i % MIX_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <ul className="flex-1 space-y-1.5">
              {assetMix.map((a, i) => (
                <li key={a.name} className="flex items-center gap-2 text-[12.5px]">
                  <span className="size-2.5 rounded-sm" style={{ background: MIX_COLORS[i % MIX_COLORS.length] }} />
                  <span className="flex-1 text-ink">{a.name}</span>
                  <span className="text-muted-foreground tnum">{moneyShort(a.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
        <Panel title="Geography" description="Mid-Atlantic focus · active pipeline">
          <ul className="space-y-3">
            {byState.map(([st, v]) => (
              <li key={st}>
                <div className="flex justify-between text-[12.5px]">
                  <span className="font-medium text-ink">{st}</span>
                  <span className="text-muted-foreground tnum">{moneyShort(v)}</span>
                </div>
                <Bar value={v / maxState} className="mt-1" tone="bg-ink" />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recently moved" description="Latest stage transitions" bodyClassName="p-2">
          <ul>
            {[...deals]
              .filter((d) => (ACTIVE as readonly string[]).includes(d.stage) || d.stage === "approved")
              .sort((a, b) => (a.stageEnteredAt < b.stageEnteredAt ? 1 : -1))
              .slice(0, 5)
              .map((d) => (
                <li key={d.id}>
                  <Link href={`/deals/${d.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-muted/70">
                    <AssetTile type={d.assetType} className="size-8" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">{d.name}</span>
                      <span className="block text-[11.5px] text-muted-foreground">{money(d.loanAmount)} · {relative(d.stageEnteredAt)}</span>
                    </span>
                    <StagePill stage={d.stage} />
                  </Link>
                </li>
              ))}
          </ul>
        </Panel>
      </div>

      <p className="pb-4 text-center text-[11px] text-muted-foreground">
        All figures computed live from fictional demo data.
      </p>
    </div>
  );
}
