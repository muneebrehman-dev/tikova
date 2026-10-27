"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  CheckCircle2,
  Cpu,
  Fingerprint,
  Loader2,
  Lock,
  Pencil,
  Play,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
  CircleX,
  Quote,
  Keyboard,
} from "lucide-react";
import { useApp, useDeal } from "@/lib/store";
import { can } from "@/lib/data/personas";
import { DOC_CLASS_LABEL } from "@/lib/data/documents";
import { hash16 } from "@/lib/engine/hash";
import { dateTime, formatValue, int } from "@/lib/format";
import type { DealDocument, ExtractedField } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AnchorContext, DocPages, PAGE_INDEX } from "@/components/documents/doc-pages";
import { ClaudeChip, DocStatusPill, Empty, FieldStatusPill, Pill } from "@/components/common/ui";

/* ------------------------------ helpers -------------------------------- */

function parseInput(raw: string, format: ExtractedField["format"]): number | string | null {
  if (format === "text" || format === "date") return raw.trim() || null;
  const n = Number(raw.replace(/[$,%x\s]/g, ""));
  if (!Number.isFinite(n)) return null;
  if (format === "pct") return n / 100;
  return n;
}

function inputValue(v: number | string, format: ExtractedField["format"]): string {
  if (typeof v === "string") return v;
  if (format === "pct") return (v * 100).toFixed(2);
  return String(v);
}

const CONF: Record<ExtractedField["confidence"], { label: string; cls: string }> = {
  high: { label: "High", cls: "bg-pass" },
  medium: { label: "Medium", cls: "bg-soft" },
  low: { label: "Low", cls: "bg-fail" },
};

/* --------------------------- extraction run ---------------------------- */

const RUN_STEPS = [
  { icon: Fingerprint, label: "Verify SHA-256 and load immutable original" },
  { icon: ShieldCheck, label: "PII scan: SSN and 2 account numbers redacted before model call" },
  { icon: Sparkles, label: "Classify: Sponsor financial statement (PFS + REO) · confidence 0.98" },
  { icon: ScanSearch, label: "Route: scanned PDF → Claude vision with OCR cross-check" },
  { icon: Cpu, label: "Extract 7 fields against schema SponsorFinancials@2.1.0 (tool use, strict JSON)" },
  { icon: CheckCheck, label: "Validate with 5 deterministic rules" },
];

function ExtractionRunner({ doc }: { doc: DealDocument }) {
  const start = useApp((s) => s.startExtraction);
  const finish = useApp((s) => s.finishExtraction);
  const canRun = can(useApp((s) => s.persona), "extract.run");
  const [step, setStep] = React.useState(-1);
  const [streamed, setStreamed] = React.useState(0);
  const running = doc.status === "processing";

  React.useEffect(() => {
    if (!running) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const delays = [0, 700, 1500, 2300, 3000, 5600];
    delays.forEach((d, i) => timers.push(setTimeout(() => setStep(i), d)));
    doc.fields.forEach((_, i) => timers.push(setTimeout(() => setStreamed(i + 1), 3200 + i * 330)));
    timers.push(
      setTimeout(() => {
        setStep(RUN_STEPS.length);
        finish(doc.id);
        toast.success("Extraction complete", { description: `${doc.fields.length} fields extracted with page evidence · 1 freshness warning` });
      }, 6600),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  if (!running) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-strong ring-1 ring-brand/30">
          <Sparkles className="size-6" />
        </span>
        <h3 className="mt-4 font-display text-xl font-semibold text-ink">Ready for AI extraction</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Scanned sponsor PFS and REO schedule. PII has already been redacted. Claude will extract values into a strict schema with
          page-level evidence; deterministic rules validate the result before anything reaches underwriting.
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button size="lg" className="mt-6" disabled={!canRun} onClick={() => start(doc.id)}>
                <Play /> Run extraction
              </Button>
            </span>
          </TooltipTrigger>
          {!canRun && <TooltipContent>Your role cannot run AI extraction.</TooltipContent>}
        </Tooltip>
        <div className="mt-3 text-[11px] text-muted-foreground">Model pinned: claude-sonnet-5-5 · prompt pfs-reo.v3</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex items-center gap-2">
        <ClaudeChip>Extraction running</ClaudeChip>
        <span className="text-xs text-muted-foreground">Idempotency key {hash16(doc.sha256 + "pfs-reo.v3").slice(0, 12)}</span>
      </div>
      <ol className="mt-4 space-y-2.5">
        {RUN_STEPS.map((s, i) => {
          const done = step > i;
          const cur = step === i;
          return (
            <motion.li
              key={s.label}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: done || cur ? 1 : 0.45 }}
              className="flex items-start gap-3 text-[13px]"
            >
              <span className={cn("mt-px grid size-7 shrink-0 place-items-center rounded-lg", done ? "bg-pass-soft text-pass" : cur ? "bg-brand-soft text-brand-strong" : "bg-muted text-muted-foreground")}>
                {done ? <Check className="size-4" /> : cur ? <Loader2 className="size-4 animate-spin" /> : <s.icon className="size-4" />}
              </span>
              <span className="pt-1 text-ink">{s.label}</span>
            </motion.li>
          );
        })}
      </ol>
      <div className="mt-5 space-y-2">
        {doc.fields.map((f, i) => (
          <div key={f.id} className="flex items-center justify-between rounded-xl border px-3 py-2.5">
            <span className="text-[12.5px] text-muted-foreground">{f.label}</span>
            {i < streamed ? (
              <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="font-semibold text-ink tnum">
                {formatValue(f.value, f.format)}
              </motion.span>
            ) : (
              <span className="shimmer h-4 w-24 rounded" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ field row ------------------------------ */

function FieldRow({
  doc,
  field,
  selected,
  onSelect,
}: {
  doc: DealDocument;
  field: ExtractedField;
  selected: boolean;
  onSelect: () => void;
}) {
  const persona = useApp((s) => s.persona);
  const approve = useApp((s) => s.approveField);
  const edit = useApp((s) => s.editField);
  const reject = useApp((s) => s.rejectField);
  const [mode, setMode] = React.useState<"view" | "edit" | "reject">("view");
  const [val, setVal] = React.useState(inputValue(field.value, field.format));
  const [reason, setReason] = React.useState("");
  const allowed = field.critical ? can(persona, "field.approve_critical") : can(persona, "field.approve");
  const why = field.critical ? "Critical fields require a Senior Analyst or credit approver." : "Your role cannot approve extracted fields.";
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!selected) {
      setMode("view");
      return;
    }
    const t = setTimeout(() => ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 220);
    return () => clearTimeout(t);
  }, [selected]);

  React.useEffect(() => setVal(inputValue(field.value, field.format)), [field.value, field.format]);

  const Guard = ({ children }: { children: React.ReactElement }) =>
    allowed ? (
      children
    ) : (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{children}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-56 text-xs">{why}</TooltipContent>
      </Tooltip>
    );

  return (
    <div
      ref={ref}
      onClick={onSelect}
      className={cn(
        "cursor-pointer rounded-xl border bg-card transition",
        selected ? "border-ink/60 shadow-md ring-1 ring-ink/10" : "hover:border-ink/25",
        field.status === "approved" && !selected && "bg-[#fbfdfb]",
      )}
    >
      <div className="flex items-start gap-3 px-3.5 py-3">
        <span
          className={cn(
            "mt-1.5 size-2 shrink-0 rounded-full",
            field.status === "approved" && "bg-pass",
            field.status === "needs_review" && "bg-soft",
            field.status === "extracted" && "bg-info",
            field.status === "rejected" && "bg-fail",
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12.5px] text-muted-foreground">{field.label}</span>
            {field.critical && (
              <span className="inline-flex items-center gap-0.5 rounded bg-ink px-1 text-[9.5px] font-semibold uppercase tracking-wide text-white">
                <Lock className="size-2.5" /> Critical
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className={cn("font-display text-[17px] font-semibold text-ink tnum", field.status === "rejected" && "line-through opacity-50")}>
              {formatValue(field.value, field.format)}
            </span>
            {field.originalValue !== undefined && (
              <span className="text-[11px] text-muted-foreground">was {formatValue(field.originalValue, field.format)}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <FieldStatusPill status={field.status} />
          <span className="rounded-md border bg-muted/60 px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">p.{field.evidence.page}</span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {selected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t px-3.5 pb-3.5 pt-3" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-lg border-l-2 border-brand bg-brand-soft/50 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-brand-strong">
                  <Quote className="size-3" /> Evidence · page {field.evidence.page}
                </div>
                <p className="mt-1 text-[12.5px] italic leading-relaxed text-ink/85">“{field.evidence.quote}”</p>
              </div>
              {field.note && (
                <div className="flex gap-2 rounded-lg bg-muted/70 px-3 py-2 text-[12px] leading-relaxed text-ink/80">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-brand" />
                  {field.note}
                </div>
              )}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className={cn("size-1.5 rounded-full", CONF[field.confidence].cls)} /> Model confidence {CONF[field.confidence].label}
                </span>
                <span>· soft signal, orders the queue only</span>
              </div>

              {mode === "view" && field.status !== "approved" && (
                <div className="flex flex-wrap gap-2">
                  <Guard>
                    <Button
                      size="sm"
                      disabled={!allowed}
                      onClick={() => {
                        approve(doc.id, field.id);
                        toast.success(`Approved: ${field.label}`, { description: "Audit event written · value released to underwriting" });
                      }}
                    >
                      <Check /> Approve
                    </Button>
                  </Guard>
                  <Guard>
                    <Button size="sm" variant="outline" disabled={!allowed} onClick={() => setMode("edit")}>
                      <Pencil /> Edit
                    </Button>
                  </Guard>
                  <Guard>
                    <Button size="sm" variant="ghost" disabled={!allowed} onClick={() => setMode("reject")}>
                      <X /> Reject
                    </Button>
                  </Guard>
                </div>
              )}
              {mode === "view" && field.status === "approved" && (
                <div className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-1.5 text-pass">
                    <CheckCircle2 className="size-4" /> Approved{field.editedBy ? " with override" : ""}
                  </span>
                  <Guard>
                    <Button size="xs" variant="outline" disabled={!allowed} onClick={() => setMode("edit")}>
                      <Pencil /> Override
                    </Button>
                  </Guard>
                </div>
              )}
              {mode === "edit" && (
                <div className="space-y-2">
                  <Input value={val} onChange={(e) => setVal(e.target.value)} className="h-9 font-mono" autoFocus />
                  <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for change (required, audit-logged)" className="min-h-14 text-[12.5px]" />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!reason.trim() || parseInput(val, field.format) === null}
                      onClick={() => {
                        const parsed = parseInput(val, field.format);
                        if (parsed === null) return;
                        edit(doc.id, field.id, parsed, reason.trim());
                        setMode("view");
                        setReason("");
                        toast.success(`Overridden: ${field.label}`, { description: `${formatValue(field.value, field.format)} → ${formatValue(parsed, field.format)}` });
                      }}
                    >
                      Save & approve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setMode("view")}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              {mode === "reject" && (
                <div className="space-y-2">
                  <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this value wrong? (re-ask once, then manual entry)" className="min-h-14 text-[12.5px]" autoFocus />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={!reason.trim()}
                      onClick={() => {
                        reject(doc.id, field.id, reason.trim());
                        setMode("view");
                        setReason("");
                        toast("Field rejected", { description: "Value blocked from sizing; flagged for re-extraction." });
                      }}
                    >
                      Reject value
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setMode("view")}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------- page --------------------------------- */

export default function ReviewPage() {
  const { id, docId } = useParams<{ id: string; docId: string }>();
  const deal = useDeal(id);
  const documents = useApp((s) => s.documents);
  const approveAll = useApp((s) => s.approveAllNonCritical);
  const persona = useApp((s) => s.persona);
  const doc = documents.find((d) => d.id === docId);
  const [selected, setSelected] = React.useState<string | null>(null);
  const viewerRef = React.useRef<HTMLDivElement>(null);

  const fields = React.useMemo(() => doc?.fields ?? [], [doc]);
  const activeAnchor = fields.find((f) => f.id === selected)?.evidence.anchor ?? null;

  // default selection: first field that needs attention
  React.useEffect(() => {
    if (!doc || selected || doc.status === "ready" || doc.status === "processing") return;
    const first = doc.fields.find((f) => f.status === "needs_review") ?? doc.fields.find((f) => f.status !== "approved") ?? doc.fields[0];
    if (first) setSelected(first.id);
  }, [doc, selected]);

  // scroll the viewer to the evidence anchor
  React.useEffect(() => {
    if (!activeAnchor || !viewerRef.current) return;
    const el = viewerRef.current.querySelector(`[data-anchor="${activeAnchor}"]`);
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeAnchor]);

  // keyboard: ↑/↓ navigate, A approve
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
      if (!fields.length) return;
      const idx = fields.findIndex((f) => f.id === selected);
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        setSelected(fields[Math.min(fields.length - 1, idx + 1)].id);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        setSelected(fields[Math.max(0, idx - 1)].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fields, selected]);

  if (!deal || !doc) {
    return (
      <Empty icon={CircleX} title="Document not found">
        <Link href={`/deals/${id}/documents`} className="underline">Back to documents</Link>
      </Empty>
    );
  }

  const extractable = documents.filter((d) => d.dealId === deal.id && d.extractable && d.fields.length);
  const idx = extractable.findIndex((d) => d.id === doc.id);
  const next = extractable[(idx + 1) % extractable.length];
  const prev = extractable[(idx - 1 + extractable.length) % extractable.length];
  const showFields = doc.status !== "ready" && doc.status !== "processing";
  const approved = fields.filter((f) => f.status === "approved").length;
  const crit = fields.filter((f) => f.critical);
  const critApproved = crit.filter((f) => f.status === "approved").length;
  const groups = Array.from(new Set(fields.map((f) => f.group)));
  const pages = PAGE_INDEX[doc.id] ?? [1];
  const idemKey = hash16(`${doc.sha256}|${doc.run?.promptVersion}|${doc.run?.schemaVersion}|${doc.run?.model}`);

  const onViewerClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("[data-anchor]") as HTMLElement | null;
    if (!a) return;
    const f = fields.find((x) => x.evidence.anchor === a.dataset.anchor);
    if (f && showFields) setSelected(f.id);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/deals/${deal.id}/documents`}>
              <ArrowLeft /> Documents
            </Link>
          </Button>
          <span className="text-muted-foreground/40">/</span>
          <span className="truncate font-display text-[15px] font-semibold text-ink">{DOC_CLASS_LABEL[doc.docClass]}</span>
          <DocStatusPill status={doc.status} />
        </div>
        <div className="flex items-center gap-2">
          {doc.run && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Cpu /> Run provenance
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 text-[12.5px]">
                <div className="mb-2 font-display text-sm font-semibold">Extraction run {doc.run.id}</div>
                {[
                  ["Model (pinned)", doc.run.model],
                  ["Prompt version", doc.run.promptVersion],
                  ["Schema version", doc.run.schemaVersion],
                  ["Started", dateTime(doc.run.startedAt)],
                  ["Latency", `${(doc.run.latencyMs / 1000).toFixed(1)} s`],
                  ["Tokens in / out", `${int(doc.run.inputTokens)} / ${int(doc.run.outputTokens)}`],
                  ["Est. cost", `$${doc.run.costUsd.toFixed(2)}`],
                  ["Document sha256", `${doc.sha256.slice(0, 16)}…`],
                  ["Idempotency key", idemKey],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b py-1.5 last:border-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="truncate font-mono text-[11.5px] text-ink">{v}</span>
                  </div>
                ))}
                <p className="mt-2 text-[11px] text-muted-foreground">Re-runs with identical inputs reuse this result. Model upgrades must pass the regression set first.</p>
              </PopoverContent>
            </Popover>
          )}
          {extractable.length > 1 && (
            <div className="flex">
              <Button variant="outline" size="sm" className="rounded-r-none" asChild>
                <Link href={`/deals/${deal.id}/documents/${prev.id}`} aria-label="Previous document">
                  <ArrowLeft />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="-ml-px rounded-l-none" asChild>
                <Link href={`/deals/${deal.id}/documents/${next.id}`}>
                  Next: {DOC_CLASS_LABEL[next.docClass].split(" (")[0]} <ArrowRight />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(400px,0.8fr)]">
        {/* Viewer */}
        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-ink">{doc.fileName}</div>
              <div className="text-[11px] text-muted-foreground">
                v{doc.version} · {doc.pages} pages · {doc.route}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {doc.pages > pages.length && <span className="mr-1 text-[11px] text-muted-foreground">Sections located:</span>}
              {pages.map((p) => (
                <button
                  key={p}
                  onClick={() => viewerRef.current?.querySelector(`#page-${p}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className={cn(
                    "rounded-md border px-2 py-0.5 font-mono text-[11px] transition hover:bg-muted",
                    fields.find((f) => f.id === selected)?.evidence.page === p && "border-ink bg-ink text-white hover:bg-ink",
                  )}
                >
                  p.{p}
                </button>
              ))}
            </div>
          </div>
          {doc.piiRedactions && (
            <div className="flex items-center gap-2 border-b bg-brand-soft/60 px-4 py-2 text-[11.5px] text-brand-strong">
              <ShieldCheck className="size-3.5" /> {doc.piiRedactions.join(" · ")}
            </div>
          )}
          <div
            ref={viewerRef}
            onClick={onViewerClick}
            className="scrollbar-thin h-[calc(100dvh-250px)] min-h-[560px] space-y-6 overflow-y-auto bg-[#e9e7e1] p-4 md:p-6"
          >
            <AnchorContext.Provider value={activeAnchor}>
              <DocPages doc={doc} />
            </AnchorContext.Provider>
            {doc.pages > pages.length && (
              <div className="text-center text-[11px] text-muted-foreground">
                Showing {pages.length} of {doc.pages} pages · relevant sections located by table-of-contents and heading analysis
              </div>
            )}
          </div>
        </section>

        {/* Fields */}
        <section className="flex h-[calc(100dvh-250px+49px)] min-h-[609px] flex-col overflow-hidden rounded-2xl border bg-card">
          <div className="border-b px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap font-display text-[15px] font-semibold text-ink">Extracted fields</span>
                {showFields && <span className="hidden font-mono text-[10.5px] text-muted-foreground 2xl:inline">{doc.run?.schemaVersion}</span>}
              </div>
              {showFields && can(persona, "field.approve") && fields.some((f) => !f.critical && f.status !== "approved" && f.status !== "rejected") && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    approveAll(doc.id);
                    toast.success("Non-critical fields approved", { description: "Critical fields still require individual review." });
                  }}
                >
                  <CheckCheck /> Approve non-critical
                </Button>
              )}
            </div>
            {showFields && (
              <div className="mt-2.5 grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>All fields</span>
                    <span className="tnum">{approved}/{fields.length}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted">
                    <div className="h-1.5 rounded-full bg-pass transition-all" style={{ width: `${(approved / Math.max(1, fields.length)) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Lock className="size-3" /> Critical</span>
                    <span className="tnum">{critApproved}/{crit.length}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted">
                    <div className="h-1.5 rounded-full bg-ink transition-all" style={{ width: `${(critApproved / Math.max(1, crit.length)) * 100}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {!showFields ? (
            <ExtractionRunner doc={doc} />
          ) : (
            <>
              <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
                {crit.length > 0 && critApproved === crit.length && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3 rounded-xl border border-pass/25 bg-pass-soft px-3.5 py-2.5">
                    <span className="flex items-center gap-2 text-[12.5px] font-medium text-pass">
                      <CheckCircle2 className="size-4" /> All critical fields approved: released to sizing
                    </span>
                    <Link href={`/deals/${deal.id}/sizing`} className="text-[12px] font-semibold text-pass underline">
                      Sizing →
                    </Link>
                  </motion.div>
                )}
                {groups.map((g) => (
                  <div key={g}>
                    <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{g}</div>
                    <div className="space-y-2">
                      {fields
                        .filter((f) => f.group === g)
                        .map((f) => (
                          <FieldRow key={f.id} doc={doc} field={f} selected={selected === f.id} onSelect={() => setSelected(f.id)} />
                        ))}
                    </div>
                  </div>
                ))}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Validation rules · code</span>
                    <Pill tone="ink">deterministic</Pill>
                  </div>
                  <ul className="space-y-1.5">
                    {doc.validations.map((v) => (
                      <li key={v.id} className="flex gap-2.5 rounded-lg bg-muted/50 px-3 py-2 text-[12px]">
                        {v.status === "pass" ? (
                          <CheckCircle2 className="mt-px size-4 shrink-0 text-pass" />
                        ) : v.status === "warn" ? (
                          <TriangleAlert className="mt-px size-4 shrink-0 text-soft" />
                        ) : (
                          <CircleX className="mt-px size-4 shrink-0 text-fail" />
                        )}
                        <span>
                          <span className="font-medium text-ink">{v.label}</span>
                          <span className="block text-muted-foreground">{v.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex items-center justify-between border-t px-4 py-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><Keyboard className="size-3.5" /> ↑ ↓ to move between fields · click the document to jump back</span>
                <span>Only approved values reach sizing</span>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
