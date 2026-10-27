"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, KeyRound, Lock, ShieldCheck, UserPlus, Users, Database, Timer, Globe2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { PERMISSION_LABELS, PERSONAS, ROLE_PERMISSIONS, type Permission } from "@/lib/data/personas";
import { useCan } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, PersonaAvatar, Pill } from "@/components/common/ui";

const LAST: Record<string, string> = {
  senior_analyst: "Active now",
  ceo: "12 min ago",
  partner: "2 h ago",
  capital_markets: "34 min ago",
  analyst: "1 h ago",
  construction: "3 h ago",
  closing: "Yesterday",
  cfo: "1 h ago",
  investor_relations: "Yesterday",
  it_admin: "29 min ago",
};

export default function AdminPage() {
  const persona = useApp((s) => s.persona);
  const canManage = useCan("users.manage");
  const [tab, setTab] = React.useState<"users" | "matrix" | "security">("users");
  const perms = Object.keys(PERMISSION_LABELS) as Permission[];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Users & Roles"
        description="Least-privilege, role-based access checked on every API call, plus record-level rules so capital partners never see each other's data."
        actions={
          <Button size="lg" disabled={!canManage} onClick={() => toast("Invite sent via Microsoft Entra ID", { description: "New users join as Read-only until a role is assigned." })}>
            <UserPlus /> Invite user
          </Button>
        }
      />
      {!canManage && (
        <div className="flex items-center gap-2 rounded-2xl border bg-muted/40 px-4 py-3 text-[12.5px] text-muted-foreground">
          <Lock className="size-4" /> Viewing as {PERSONAS.find((p) => p.id === persona)?.title}: read-only. Switch to IT Administrator to manage users.
        </div>
      )}
      <div className="flex rounded-xl border bg-card p-0.5 text-[13px] w-fit">
        {(
          [
            ["users", Users, "Users"],
            ["matrix", ShieldCheck, "Permission matrix"],
            ["security", KeyRound, "Security settings"],
          ] as const
        ).map(([k, I, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("flex h-8 items-center gap-1.5 rounded-[10px] px-3 font-medium", tab === k ? "bg-ink text-white" : "text-muted-foreground hover:text-ink")}>
            <I className="size-3.5" /> {l}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="w-full text-[13px]">
            <thead className="border-b bg-muted/40 text-left text-[11.5px] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 font-medium">User (role title)</th>
                <th className="px-3 font-medium">Group</th>
                <th className="px-3 font-medium">Sign-in</th>
                <th className="px-3 font-medium">MFA</th>
                <th className="px-3 font-medium">Permissions</th>
                <th className="px-5 font-medium">Last active</th>
              </tr>
            </thead>
            <tbody>
              {PERSONAS.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <PersonaAvatar id={p.id} size={30} />
                      <div>
                        <div className="font-semibold text-ink">{p.title}</div>
                        <div className="text-[11.5px] text-muted-foreground">{p.blurb}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 text-muted-foreground">{p.group}</td>
                  <td className="px-3"><Pill tone="neutral">Entra ID SSO</Pill></td>
                  <td className="px-3"><Pill tone="pass" dot>Enforced</Pill></td>
                  <td className="px-3 tnum">{ROLE_PERMISSIONS[p.id].length || "Read-only"}</td>
                  <td className="px-5 text-muted-foreground">{LAST[p.id]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "matrix" && (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-[12px]">
              <thead className="border-b bg-muted/40 text-[11px] text-muted-foreground">
                <tr>
                  <th className="sticky left-0 bg-muted/90 px-5 py-2.5 text-left font-medium">Permission</th>
                  {PERSONAS.map((p) => (
                    <th key={p.id} className="px-2 py-2.5 font-medium">
                      <div className="flex flex-col items-center gap-1">
                        <PersonaAvatar id={p.id} size={22} />
                        <span className="w-20 text-center leading-tight">{p.title}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {perms.map((perm) => (
                  <tr key={perm} className="border-b last:border-0">
                    <td className="sticky left-0 bg-card px-5 py-2 font-medium text-ink">
                      {PERMISSION_LABELS[perm]}
                      <div className="font-mono text-[10.5px] font-normal text-muted-foreground">{perm}</div>
                    </td>
                    {PERSONAS.map((p) => (
                      <td key={p.id} className="px-2 text-center">
                        {ROLE_PERMISSIONS[p.id].includes(perm) ? (
                          <span className="inline-grid size-6 place-items-center rounded-md bg-pass-soft text-pass"><Check className="size-3.5" /></span>
                        ) : (
                          <span className="inline-block size-1.5 rounded-full bg-border" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t px-5 py-3 text-[12px] text-muted-foreground">
            Every role × endpoint combination is covered by automated authorization tests. Try switching roles (top-right): buttons disable and explain why.
          </div>
        </div>
      )}

      {tab === "security" && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[
            { i: KeyRound, t: "Authentication", rows: [["Identity provider", "Microsoft Entra ID"], ["MFA", "Enforced for all users"], ["Session timeout", "30 min idle · 12 h absolute"], ["Refresh tokens", "Rotated on use"]] },
            { i: ShieldCheck, t: "Authorization", rows: [["Model", "Role-based + record-level"], ["Partner isolation", "PostgreSQL row-level security"], ["Exceptions", "Logged with approver & reason"], ["Prod access", "Just-in-time, MFA, logged"]] },
            { i: Database, t: "Data protection", rows: [["At rest", "AES-256 · managed KMS keys"], ["In transit", "TLS 1.2+ · HSTS"], ["Documents", "Private buckets · signed URLs (5 min)"], ["Uploads", "Type sniffing + antivirus"]] },
            { i: Timer, t: "Resilience", rows: [["Backups", "Daily + point-in-time recovery"], ["Targets (proposed)", "RPO ≤ 15 min · RTO ≤ 4 h"], ["Restore drills", "At least quarterly"], ["Deploys", "Blue/green · one-click rollback"]] },
            { i: Globe2, t: "Hosting", rows: [["Cloud", "Tikova-owned AWS or Azure account"], ["Region", "US (confirm in discovery)"], ["Database", "Private subnet; never public"], ["Secrets", "Managed vault; never in code"]] },
            { i: Lock, t: "Logging", rows: [["Audit trail", "Append-only · hash-chained"], ["App logs", "No document contents or PII"], ["Correlation", "Request IDs end to end"], ["Compliance", "Designed to align with SOC 2"]] },
          ].map((c) => (
            <Panel key={c.t} title={c.t} icon={c.i}>
              {c.rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b py-2 text-[12.5px] last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-right font-medium text-ink">{v}</span>
                </div>
              ))}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
