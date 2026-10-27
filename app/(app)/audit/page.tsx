"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Download, Link2, Loader2, Search, ShieldAlert, ShieldCheck, FlaskConical } from "lucide-react";
import { useApp } from "@/lib/store";
import { verifyChain } from "@/lib/data/audit";
import { PERSONAS } from "@/lib/data/personas";
import { dateTime } from "@/lib/format";
import type { AuditEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageHeader, PersonaAvatar, Pill, actorName } from "@/components/common/ui";

export default function AuditPage() {
  const audit = useApp((s) => s.audit);
  const [q, setQ] = React.useState("");
  const [actor, setActor] = React.useState("all");
  const [kind, setKind] = React.useState("all");
  const [sel, setSel] = React.useState<AuditEvent | null>(null);
  const [verify, setVerify] = React.useState<{ state: "idle" | "running" | "ok" | "broken"; msg?: string; progress: number }>({ state: "idle", progress: 0 });

  const kinds = Array.from(new Set(audit.map((e) => e.action.split(".")[0]))).sort();
  const rows = [...audit]
    .reverse()
    .filter((e) => actor === "all" || e.actor === actor)
    .filter((e) => kind === "all" || e.action.startsWith(kind + "."))
    .filter((e) => !q || `${e.entityLabel} ${e.action} ${e.after ?? ""} ${e.before ?? ""} ${e.reason ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  const run = (tamper: boolean) => {
    setVerify({ state: "running", progress: 0 });
    const events = tamper ? audit.map((e, i) => (i === Math.floor(audit.length / 2) ? { ...e, after: "$9,999,999" } : e)) : audit;
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      setTimeout(() => setVerify((v) => ({ ...v, progress: i / steps })), i * 45);
    }
    setTimeout(() => {
      const r = verifyChain(events);
      if (r.ok) {
        setVerify({ state: "ok", progress: 1, msg: `${events.length} events verified · head ${events[events.length - 1].hash}` });
        toast.success("Audit chain intact");
      } else {
        setVerify({ state: "broken", progress: 1, msg: `Tamper detected at ${r.brokenAt}: stored hash no longer matches its contents` });
        toast.error("Tamper test: chain broken as expected", { description: "In production this raises an alert; the stored log is untouched." });
      }
    }, steps * 45 + 150);
  };

  const exportCsv = () => {
    const header = "id,at,actor,action,entity_type,entity_id,before,after,reason,prev_hash,hash";
    const body = audit
      .map((e) => [e.id, e.at, e.actor, e.action, e.entityType, e.entityId, e.before ?? "", e.after ?? "", e.reason ?? "", e.prevHash, e.hash].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tikova-audit-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security & accountability"
        title="Audit Trail"
        description="Append-only record of every material change: who, when, before/after and why. Each event's hash includes the previous one, so any edit breaks the chain."
        actions={
          <>
            <Button variant="outline" size="lg" onClick={exportCsv}>
              <Download /> Export CSV
            </Button>
            <Button variant="outline" size="lg" onClick={() => run(true)} disabled={verify.state === "running"}>
              <FlaskConical /> Tamper test
            </Button>
            <Button size="lg" onClick={() => run(false)} disabled={verify.state === "running"}>
              <ShieldCheck /> Verify chain
            </Button>
          </>
        }
      />

      {verify.state !== "idle" && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl border p-4",
            verify.state === "ok" && "border-pass/30 bg-pass-soft",
            verify.state === "broken" && "border-fail/30 bg-fail-soft",
            verify.state === "running" && "bg-card",
          )}
        >
          <div className="flex items-center gap-2 text-[13px] font-medium">
            {verify.state === "running" && <><Loader2 className="size-4 animate-spin" /> Recomputing hashes…</>}
            {verify.state === "ok" && <span className="flex items-center gap-2 text-pass"><ShieldCheck className="size-4" /> Chain intact: {verify.msg}</span>}
            {verify.state === "broken" && <span className="flex items-center gap-2 text-fail"><ShieldAlert className="size-4" /> {verify.msg}</span>}
          </div>
          <div className="mt-2.5 h-1.5 rounded-full bg-white/70">
            <div className={cn("h-1.5 rounded-full transition-all", verify.state === "broken" ? "bg-fail" : "bg-pass")} style={{ width: `${verify.progress * 100}%` }} />
          </div>
        </motion.div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events…" className="h-9 rounded-xl bg-card pl-9" />
        </div>
        <Select value={actor} onValueChange={setActor}>
          <SelectTrigger className="h-9 w-48 rounded-xl bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actors</SelectItem>
            <SelectItem value="claude">Claude (AI)</SelectItem>
            <SelectItem value="system">System</SelectItem>
            {PERSONAS.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="h-9 w-44 rounded-xl bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {kinds.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="ml-auto text-[12px] text-muted-foreground">{rows.length} of {audit.length} events</span>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-[12.5px]">
            <thead className="border-b bg-muted/40 text-left text-[11px] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 font-medium">Time (UTC)</th>
                <th className="px-3 font-medium">Actor</th>
                <th className="px-3 font-medium">Action</th>
                <th className="px-3 font-medium">Entity</th>
                <th className="px-3 font-medium">Change</th>
                <th className="px-5 font-medium">Hash</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} onClick={() => setSel(e)} className="cursor-pointer border-b last:border-0 hover:bg-muted/40">
                  <td className="whitespace-nowrap px-5 py-2.5 font-mono text-[11.5px] text-muted-foreground">{dateTime(e.at)}</td>
                  <td className="px-3">
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <PersonaAvatar id={e.actor} size={22} /> {actorName(e.actor)}
                    </span>
                  </td>
                  <td className="px-3"><span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px]">{e.action}</span></td>
                  <td className="max-w-[220px] truncate px-3 text-ink">{e.entityLabel}</td>
                  <td className="max-w-[280px] px-3">
                    <span className="block truncate">
                      {e.before && <span className="text-muted-foreground line-through">{e.before}</span>}
                      {e.before && e.after && " → "}
                      {e.after && <span className="font-medium text-ink">{e.after}</span>}
                    </span>
                  </td>
                  <td className="px-5 font-mono text-[11px] text-muted-foreground">{e.hash.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={Boolean(sel)} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {sel && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-xl">{sel.action}</SheetTitle>
                <SheetDescription>{sel.entityLabel}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 overflow-y-auto px-4 pb-6">
                <div className="flex items-center gap-2">
                  <PersonaAvatar id={sel.actor} size={28} />
                  <span className="text-sm font-medium">{actorName(sel.actor)}</span>
                  <Pill tone="neutral">{dateTime(sel.at)}</Pill>
                </div>
                {(sel.before || sel.after) && (
                  <div className="grid grid-cols-2 gap-2 text-[12.5px]">
                    <div className="rounded-xl bg-fail-soft/60 p-3"><div className="text-[10.5px] font-semibold uppercase text-fail">Before</div><div className="mt-1">{sel.before ?? "—"}</div></div>
                    <div className="rounded-xl bg-pass-soft p-3"><div className="text-[10.5px] font-semibold uppercase text-pass">After</div><div className="mt-1">{sel.after ?? "—"}</div></div>
                  </div>
                )}
                {sel.reason && <div className="rounded-xl bg-muted/60 p-3 text-[12.5px] italic">“{sel.reason}”</div>}
                <pre className="overflow-x-auto rounded-xl bg-ink p-4 font-mono text-[11px] leading-relaxed text-zinc-300">
                  {JSON.stringify(
                    {
                      id: sel.id,
                      occurred_at: sel.at,
                      actor_id: sel.actor,
                      action: sel.action,
                      entity_type: sel.entityType,
                      entity_id: sel.entityId,
                      before: sel.before ?? null,
                      after: sel.after ?? null,
                      reason: sel.reason ?? null,
                      request_id: sel.requestId,
                      prev_hash: sel.prevHash,
                      hash: sel.hash,
                    },
                    null,
                    2,
                  )}
                </pre>
                <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
                  <Link2 className="size-3.5" /> hash = H(prev_hash ‖ event fields): editing any field invalidates every later hash.
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
