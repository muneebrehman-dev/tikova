# Tikova Loan Platform — Interactive Prototype

Clickable prototype of Tikova's AI-assisted commercial construction & bridge loan platform (Phase 1: origination + AI-assisted underwriting, with previews of later lifecycle modules).

All deals, sponsors, brokers and capital partners are **fictional demo data**. Tikova users appear by role title only.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

Deploy: `npx vercel --prod` (or import the repo in the Vercel dashboard; no environment variables needed).

## Guided demo (≈ 6 minutes)

1. **Sign in** → "Start guided demo as Senior Analyst".
2. **Dashboard** → open *Harborview Lofts* (guided demo card).
3. **Screening** tab → four capital partners: Pass / Soft miss / Incomplete / Hard fail, with the reason for every rule. Adjust the capital stack slider.
4. **Documents** → open the **Appraisal**. Click any field to jump to its evidence on the page; approve the critical values. Click a highlighted value in the document to jump back.
5. Open **Sponsor Financials** → *Run extraction* (scanned PDF, PII redacted, fields stream in with evidence).
6. **Documents** → *Upload* → use the sample Phase I ESA → Atlas SMA screening flips from Incomplete to Pass.
7. **Sizing** → move the take-out rate slider: +25 bps breaks the 1.20x DSCR floor. Save an underwriting run.
8. **Credit Memo** → hover a number: every figure is inserted by code; Claude drafts narrative only. Submit to committee.
9. Switch role (top-right) to **Founder & CEO** → **Committee** tab → cast a vote → quorum reached → deal approved.
10. **Audit Trail** → *Verify chain*, then *Tamper test*.
11. Phase 2+ previews: **Construction Draws**, **Participations & Waterfall**, **Portfolio**.

## Structure

- `lib/engine/` — deterministic sizing, buy-box rules engine, waterfall, hash chain
- `lib/data/` — demo data (deal book, Harborview underwriting file, partners, audit seed)
- `lib/store.ts` — client state (zustand); every action writes a hash-chained audit event
- `components/documents/doc-pages.tsx` — rendered source documents with evidence anchors
- `app/(app)/…` — pages

Stack: Next.js 15 · React 19 · TypeScript · Tailwind v4 · shadcn/ui (Radix) · Recharts · Framer Motion · dnd-kit.
