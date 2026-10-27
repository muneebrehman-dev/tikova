"use client";

import * as React from "react";
import { useApp } from "@/lib/store";
import { can, type Permission } from "@/lib/data/personas";
import { PARTNERS } from "@/lib/data/partners";
import { SPONSOR } from "@/lib/data/relationships";
import { factsFor, screen } from "@/lib/engine/buybox";
import type { Deal, ScreeningResult } from "@/lib/types";

export function useMounted() {
  const [m, setM] = React.useState(false);
  React.useEffect(() => setM(true), []);
  return m;
}

export function useCan(perm: Permission) {
  const persona = useApp((s) => s.persona);
  return can(persona, perm);
}

export function screenDeal(deal: Deal): ScreeningResult[] {
  const facts = factsFor(deal, SPONSOR[deal.sponsorId]);
  return PARTNERS.map((p) => screen(p, facts));
}

export function useScreening(deal: Deal | undefined): ScreeningResult[] {
  return React.useMemo(() => (deal ? screenDeal(deal) : []), [deal]);
}
