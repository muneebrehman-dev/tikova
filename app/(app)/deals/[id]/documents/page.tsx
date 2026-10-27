"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  FileScan,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  Loader2,
  Sparkles,
  TriangleAlert,
  Upload,
  CircleX,
  ShieldCheck,
} from "lucide-react";
import { useApp, useDeal } from "@/lib/store";
import { DOC_CLASS_LABEL } from "@/lib/data/documents";
import { APPRAISAL, PRO_FORMA_RENTS, RENT_ROLL_SUMMARY as RR, T12_TOTALS, TOTAL_USES, PRO_FORMA } from "@/lib/data/harborview";
import { sha256Like } from "@/lib/engine/hash";
import { useCan } from "@/lib/hooks";
import { date, money, pct, relative } from "@/lib/format";
import type { DealDocument, DocClass } from "@/lib/types";
import { cn } from "@/lib/utils";
import { nowIso } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClaudeChip, CodeChip, DocStatusPill, Panel, PersonaAvatar, actorName } from "@/components/common/ui";

function FormatIcon({ doc }: { doc: DealDocument }) {
  const I = doc.format === "xlsx" ? FileSpreadsheet : doc.format === "pdf-scan" ? FileScan : FileText;
  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl",
        doc.status === "missing" ? "border border-dashed text-muted-foreground" : "bg-muted text-ink",
        doc.format === "xlsx" && doc.status !== "missing" && "bg-pass-soft text-pass",
      )}
    >
      <I className="size-[18px]" />
    </span>
  );
}

interface Check {
  label: string;
  left: string;
  right: string;
  delta: string;
  status: "pass" | "warn" | "pending";
}

function crossChecks(pfsReviewed: boolean): Check[] {
  const rrAnnual = RR.annualizedContractRent;
  const d1 = rrAnnual / T12_TOTALS.netRental - 1;
  const d2 = PRO_FORMA.noi / APPRAISAL.noi - 1;
  const d3 = PRO_FORMA_RENTS["2BR/2BA"] / APPRAISAL.concludedRents["2BR/2BA"] - 1;
  return [
    { label: "Unit count", left: "Rent roll 64", right: "Appraisal 64 · Budget 64", delta: "0", status: "pass" },
    { label: "Occupancy", left: `Rent roll ${pct(RR.occupancy)}`, right: "Appraisal 89.0%", delta: "0.1 pts", status: "pass" },
    { label: "In-place rent (annual)", left: `Rent roll ${money(rrAnnual)}`, right: `T-12 net rental ${money(T12_TOTALS.netRental)}`, delta: `${d1 >= 0 ? "+" : ""}${pct(d1)} · tol. 5%`, status: Math.abs(d1) <= 0.05 ? "pass" : "warn" },
    { label: "Stabilized NOI", left: `Sponsor pro forma ${money(PRO_FORMA.noi)}`, right: `Appraisal ${money(APPRAISAL.noi)}`, delta: `+${pct(d2)} · tol. 5% · sizing uses lesser-of`, status: Math.abs(d2) <= 0.05 ? "pass" : "warn" },
    { label: "2BR market rent", left: `Pro forma $${PRO_FORMA_RENTS["2BR/2BA"].toLocaleString("en-US")}`, right: `Appraisal $${APPRAISAL.concludedRents["2BR/2BA"].toLocaleString("en-US")}`, delta: `+${pct(d3)} · tol. 3%`, status: Math.abs(d3) <= 0.03 ? "pass" : "warn" },
    { label: "Purchase price", left: "PSA $8,900,000", right: "Budget S&U $8,900,000", delta: "0", status: "pass" },
    { label: "Total project cost", left: `Budget ${money(TOTAL_USES)}`, right: `Loan request basis ${money(TOTAL_USES)}`, delta: "0", status: "pass" },
    { label: "Sponsor liquidity", left: "PFS (extracted)", right: "Sponsor record $1,915,000", delta: pfsReviewed ? "0" : "awaiting PFS extraction", status: pfsReviewed ? "pass" : "pending" },
  ];
}

const CLASSES: DocClass[] = ["esa", "rent_roll", "t12", "budget", "appraisal", "pfs", "psa", "om"];

function UploadDialog({ open, onOpenChange, dealId }: { open: boolean; onOpenChange: (o: boolean) => void; dealId: string }) {
  const upload = useApp((s) => s.uploadDocument);
  const persona = useApp((s) => s.persona);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<{ name: string; size: number } | null>(null);
  const [cls, setCls] = React.useState<DocClass>("esa");
  const [phase, setPhase] = React.useState<"idle" | "hash" | "scan" | "classify" | "done">("idle");

  React.useEffect(() => {
    if (!open) {
      setFile(null);
      setPhase("idle");
    }
  }, [open]);

  const start = (f: { name: string; size: number }) => {
    setFile(f);
    setPhase("hash");
    setTimeout(() => setPhase("scan"), 700);
    setTimeout(() => setPhase("classify"), 1400);
    setTimeout(() => setPhase("done"), 2300);
  };

  const steps = [
    { k: "hash", label: "SHA-256 hash & store original (immutable)", icon: Fingerprint },
    { k: "scan", label: "File-type sniff · antivirus · PII scan", icon: ShieldCheck },
    { k: "classify", label: `Classify document type`, icon: Sparkles },
  ];
  const order = ["hash", "scan", "classify", "done"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Upload document</DialogTitle>
          <DialogDescription>Originals are stored once, hashed and versioned. Claude classifies; you confirm.</DialogDescription>
        </DialogHeader>
        {!file ? (
          <>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Expected document type</label>
              <Select value={cls} onValueChange={(v) => setCls(v as DocClass)}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {DOC_CLASS_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) start({ name: f.name, size: f.size });
              }}
              className="grid place-items-center rounded-2xl border-2 border-dashed bg-muted/40 px-6 py-10 text-center transition hover:border-ink/30 hover:bg-muted"
            >
              <Upload className="size-6 text-muted-foreground" />
              <span className="mt-2 text-sm font-medium text-ink">Drop a file or click to browse</span>
              <span className="mt-1 text-xs text-muted-foreground">PDF, scanned PDF or Excel · the prototype never reads file contents</span>
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) start({ name: f.name, size: f.size });
              }}
            />
            <button
              className="text-left text-xs font-medium text-brand-strong hover:underline"
              onClick={() => start({ name: "Harborview_Phase_I_ESA_EnviroSite.pdf", size: 4_812_000 })}
            >
              Use a sample file: Harborview_Phase_I_ESA_EnviroSite.pdf →
            </button>
          </>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
              <FileText className="size-5" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{file.name}</div>
                <div className="text-xs text-muted-foreground">{(file.size / 1_000_000).toFixed(2)} MB</div>
              </div>
            </div>
            {steps.map((s) => {
              const idx = order.indexOf(s.k);
              const cur = order.indexOf(phase);
              const done = cur > idx;
              const running = cur === idx;
              return (
                <div key={s.k} className="flex items-center gap-3 text-sm">
                  <span className={cn("grid size-7 place-items-center rounded-lg", done ? "bg-pass-soft text-pass" : running ? "bg-brand-soft text-brand-strong" : "bg-muted text-muted-foreground")}>
                    {done ? <CheckCircle2 className="size-4" /> : running ? <Loader2 className="size-4 animate-spin" /> : <s.icon className="size-4" />}
                  </span>
                  <span className={cn(done || running ? "text-ink" : "text-muted-foreground")}>{s.label}</span>
                  {s.k === "classify" && done && (
                    <span className="ml-auto">
                      <ClaudeChip>{DOC_CLASS_LABEL[cls]} · 0.97</ClaudeChip>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={phase !== "done"}
            onClick={() => {
              if (!file) return;
              const at = nowIso();
              upload({
                id: `${dealId}-${cls}-${at}`,
                dealId,
                docClass: cls,
                title: DOC_CLASS_LABEL[cls],
                fileName: file.name,
                format: "pdf",
                pages: cls === "esa" ? 64 : 12,
                sizeKb: Math.round(file.size / 1000),
                sha256: sha256Like(file.name + at),
                uploadedAt: at,
                uploadedBy: persona,
                version: 1,
                status: "stored",
                extractable: false,
                fields: [],
                validations: [],
              });
              toast.success(`${DOC_CLASS_LABEL[cls]} stored`, {
                description: cls === "esa" ? "Atlas SMA screening re-ran automatically: required document now on file." : "Hashed, versioned and audit-logged.",
              });
              onOpenChange(false);
            }}
          >
            Confirm & store
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DocumentsTab() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const deal = useDeal(id);
  const allDocs = useApp((s) => s.documents);
  const canUpload = useCan("doc.upload");
  const [uploadOpen, setUploadOpen] = React.useState(false);
  if (!deal) return null;
  const docs = allDocs.filter((d) => d.dealId === deal.id);
  const isHero = deal.id === "harborview";
  const pfs = docs.find((d) => d.id === "hv-pfs");
  const checks = isHero ? crossChecks(Boolean(pfs && pfs.status !== "ready" && pfs.status !== "processing")) : [];

  const open = (d: DealDocument) => {
    if (d.status === "missing") {
      if (canUpload) setUploadOpen(true);
      else toast.error("Your role can't upload documents.");
      return;
    }
    if (!d.extractable || !d.fields.length) {
      if (!isHero && d.extractable) {
        toast("Full extraction walkthrough is wired on Harborview Lofts", {
          action: { label: "Open", onClick: () => router.push("/deals/harborview/documents/hv-appraisal") },
        });
      } else {
        toast("Stored for reference", { description: "This document class is not in the Phase 1 extraction scope." });
      }
      return;
    }
    router.push(`/deals/${deal.id}/documents/${d.id}`);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <div className="space-y-5 xl:col-span-2">
        <Panel
          title="Document library"
          description="Originals are immutable and SHA-256 hashed; new uploads create versions"
          actions={
            canUpload && (
              <Button size="sm" onClick={() => setUploadOpen(true)}>
                <Upload /> Upload
              </Button>
            )
          }
          bodyClassName="p-0"
        >
          <ul className="divide-y">
            {docs.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                No documents yet. Upload the deal package to start extraction.
              </li>
            )}
            <AnimatePresence initial={false}>
              {docs.map((d) => {
                const total = d.fields.length;
                const approved = d.fields.filter((f) => f.status === "approved").length;
                return (
                  <motion.li key={d.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <button onClick={() => open(d)} className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-muted/40">
                      <FormatIcon doc={d} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13.5px] font-semibold text-ink">{DOC_CLASS_LABEL[d.docClass]}</span>
                          {d.version > 1 && <span className="rounded bg-muted px-1.5 text-[10.5px] font-medium text-muted-foreground">v{d.version}</span>}
                          {d.piiRedactions && <span className="rounded bg-brand-soft px-1.5 text-[10.5px] font-medium text-brand-strong">PII redacted</span>}
                        </div>
                        <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
                          {d.status === "missing" ? (
                            <>Requested {date(d.uploadedAt)} from sponsor · not yet received</>
                          ) : (
                            <>
                              {d.fileName} · {d.pages} pp · {d.sizeKb >= 1000 ? `${(d.sizeKb / 1000).toFixed(1)} MB` : `${d.sizeKb} KB`} · sha256 {d.sha256.slice(0, 10)}…
                            </>
                          )}
                        </div>
                        {d.route && <div className="mt-1 text-[11px] text-muted-foreground/80">{d.route}</div>}
                      </div>
                      <div className="hidden w-28 text-right sm:block">
                        {total > 0 && d.status !== "ready" && d.status !== "processing" ? (
                          <>
                            <div className="text-[12px] font-medium text-ink tnum">{approved}/{total} approved</div>
                            <div className="mt-1 h-1 rounded-full bg-muted">
                              <div className="h-1 rounded-full bg-pass" style={{ width: `${(approved / total) * 100}%` }} />
                            </div>
                          </>
                        ) : d.status !== "missing" ? (
                          <div className="flex items-center justify-end gap-1.5 text-[11.5px] text-muted-foreground">
                            <PersonaAvatar id={d.uploadedBy} size={18} /> {relative(d.uploadedAt)}
                          </div>
                        ) : null}
                      </div>
                      <div className="w-32 text-right">
                        <DocStatusPill status={d.status} />
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </Panel>

        {isHero && (
          <Panel
            title="Cross-document consistency"
            description="Deterministic rules compare values across documents. Tolerances are configurable per policy."
            actions={<CodeChip>rules · v2.3</CodeChip>}
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-[12.5px]">
                <thead className="border-b bg-muted/40 text-left text-[11px] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-2 font-medium">Check</th>
                    <th className="px-3 py-2 font-medium">Source A</th>
                    <th className="px-3 py-2 font-medium">Source B</th>
                    <th className="px-3 py-2 font-medium">Variance</th>
                    <th className="px-5 py-2 text-right font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {checks.map((c) => (
                    <tr key={c.label} className={cn("border-b last:border-0", c.status === "warn" && "bg-soft-soft/50")}>
                      <td className="px-5 py-2.5 font-medium text-ink">{c.label}</td>
                      <td className="px-3 text-muted-foreground">{c.left}</td>
                      <td className="px-3 text-muted-foreground">{c.right}</td>
                      <td className="px-3 tnum">{c.delta}</td>
                      <td className="px-5 text-right">
                        {c.status === "pass" && <span className="inline-flex items-center gap-1 text-pass"><CheckCircle2 className="size-4" /> Pass</span>}
                        {c.status === "warn" && <span className="inline-flex items-center gap-1 font-medium text-soft"><TriangleAlert className="size-4" /> Review</span>}
                        {c.status === "pending" && <span className="inline-flex items-center gap-1 text-muted-foreground"><Loader2 className="size-4" /> Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </div>

      <div className="space-y-5">
        <Panel title="How each document is read" description="Pick the right tool per format">
          <ul className="space-y-3 text-[12.5px]">
            {[
              { icon: FileSpreadsheet, t: "Excel / CSV", d: "Parsed by code. Claude only maps non-standard headers; mapping saved per source and reused." },
              { icon: FileText, t: "Native PDF", d: "Text & table extraction, then Claude structured output against a strict schema." },
              { icon: FileScan, t: "Scanned PDF", d: "Claude vision with an OCR cross-check. PII redacted before any model call." },
              { icon: Sparkles, t: "Long appraisals", d: "ToC/heading analysis locates value, income and rent sections; extraction runs per section." },
            ].map((x) => (
              <li key={x.t} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted"><x.icon className="size-4" /></span>
                <span>
                  <span className="block font-semibold text-ink">{x.t}</span>
                  <span className="text-muted-foreground">{x.d}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Review status">
          <div className="grid grid-cols-2 gap-3 text-center">
            {[
              { k: "Approved", v: docs.filter((d) => d.status === "approved").length, c: "text-pass" },
              { k: "Needs review", v: docs.filter((d) => d.status === "needs_review").length, c: "text-soft" },
              { k: "Ready to extract", v: docs.filter((d) => d.status === "ready").length, c: "text-info" },
              { k: "Missing", v: docs.filter((d) => d.status === "missing").length, c: "text-fail" },
            ].map((x) => (
              <div key={x.k} className="rounded-xl bg-muted/50 py-3">
                <div className={cn("font-display text-2xl font-semibold", x.c)}>{x.v}</div>
                <div className="text-[11px] text-muted-foreground">{x.k}</div>
              </div>
            ))}
          </div>
          {docs.some((d) => d.status === "missing") && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-fail/20 bg-fail-soft p-3 text-[12px] text-fail">
              <CircleX className="mt-0.5 size-4 shrink-0" />
              <span>
                Missing documents block partner screening that requires them. Try uploading the sample ESA to watch screening update.
              </span>
            </div>
          )}
          <div className="mt-4 text-[11.5px] text-muted-foreground">
            Last action by {actorName(docs[docs.length - 1]?.uploadedBy ?? "senior_analyst")}
          </div>
        </Panel>
      </div>
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} dealId={deal.id} />
    </div>
  );
}
