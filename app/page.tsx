"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Lock, KeyRound } from "lucide-react";
import { useApp } from "@/lib/store";
import { PERSONAS } from "@/lib/data/personas";
import type { PersonaId } from "@/lib/types";
import { PersonaAvatar, Wordmark } from "@/components/common/ui";

const FEATURED: PersonaId[] = ["senior_analyst", "ceo", "capital_markets", "construction", "cfo", "it_admin"];

const LIFECYCLE = [
  "Origination",
  "Underwriting",
  "Due diligence",
  "Closing",
  "Construction draws",
  "Servicing",
  "Accounting",
  "Investor reporting",
];

function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 21 21" className="size-4" aria-hidden>
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

export default function SignIn() {
  const router = useRouter();
  const setPersona = useApp((s) => s.setPersona);
  const enter = (p: PersonaId) => {
    setPersona(p);
    router.push("/dashboard");
  };

  return (
    <div className="grid min-h-dvh bg-[#0b0b0c] lg:grid-cols-[1.15fr_1fr]">
      {/* Brand side */}
      <div className="bg-grid-dark relative hidden overflow-hidden lg:block">
        <div className="absolute -left-40 top-1/3 size-[620px] rounded-full bg-[radial-gradient(circle,rgba(217,146,46,0.35),transparent_60%)] blur-2xl" />
        <div className="absolute -bottom-40 right-0 size-[480px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_60%)] blur-2xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Wordmark light />
          <div className="max-w-xl">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                <Sparkles className="size-3.5 text-brand" /> AI-assisted CRE debt platform
              </span>
              <h1 className="mt-6 font-display text-[54px] font-semibold leading-[1.02] text-white">
                One platform for the life of every loan.
              </h1>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-zinc-400">
                Intake to term sheet, AI-assisted underwriting with page-level evidence, deterministic sizing and
                a credit memo your committee can trust, built for construction and bridge lending.
              </p>
            </motion.div>
            <motion.div
              className="mt-10 flex flex-wrap gap-2"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } } }}
            >
              {LIFECYCLE.map((s, i) => (
                <motion.span
                  key={s}
                  variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                  className={
                    i < 2
                      ? "rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-ink"
                      : "rounded-full border border-white/12 px-3 py-1.5 text-xs text-zinc-400"
                  }
                >
                  {s}
                </motion.span>
              ))}
            </motion.div>
            <p className="mt-3 text-[11px] text-zinc-500">
              <span className="text-brand">■</span> Phase 1 build &nbsp; <span className="text-zinc-400">□</span> Later phases (designed in the data model)
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> Tamper-evident audit trail</span>
            <span className="flex items-center gap-1.5"><Lock className="size-3.5" /> Role & partner-level access</span>
            <span className="flex items-center gap-1.5"><KeyRound className="size-3.5" /> SSO + MFA</span>
          </div>
        </div>
      </div>

      {/* Sign-in side */}
      <div className="flex items-center justify-center bg-background p-6 lg:rounded-l-[28px]">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="lg:hidden">
            <Wordmark />
          </div>
          <h2 className="mt-8 font-display text-3xl font-semibold text-ink lg:mt-0">Sign in</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Use your Tikova Microsoft account. MFA is enforced.</p>

          <button
            onClick={() => enter("senior_analyst")}
            className="mt-6 flex h-11 w-full items-center justify-center gap-3 rounded-xl border bg-card text-sm font-medium shadow-sm transition hover:bg-muted"
          >
            <MicrosoftLogo /> Continue with Microsoft
          </button>
          <div className="mt-2 text-center text-[11px] text-muted-foreground">Microsoft Entra ID · single sign-on</div>

          <div className="my-7 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> Demo: choose a role <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {FEATURED.map((id) => {
              const p = PERSONAS.find((x) => x.id === id)!;
              return (
                <button
                  key={id}
                  onClick={() => enter(id)}
                  className="group flex items-start gap-2.5 rounded-xl border bg-card p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-md"
                >
                  <PersonaAvatar id={id} size={30} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold leading-tight text-ink">{p.title}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{p.group}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => enter("senior_analyst")}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink text-sm font-medium text-white transition hover:bg-ink/85"
          >
            Start guided demo as Senior Analyst <ArrowRight className="size-4" />
          </button>
          <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            Interactive prototype prepared for Tikova. All deals, sponsors and capital partners shown are fictional
            demo data. No real borrower or investor data is used.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
