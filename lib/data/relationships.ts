import type { Broker, Sponsor } from "@/lib/types";

// All sponsors, brokers and principals are fictional demo records.
export const SPONSORS: Sponsor[] = [
  { id: "calloway", name: "Calloway Street Partners", principal: "Marcus Calloway", hq: "Baltimore, MD", founded: 2011, netWorth: 14_220_000, liquidity: 1_915_000, pfsDate: "2026-03-31", unitsDelivered: 640, activeProjects: 4, focus: ["Multifamily", "Value-add"], rating: "B+" },
  { id: "northpoint", name: "Northpoint Industrial Ventures", principal: "Elena Vasquez", hq: "Columbia, MD", founded: 2008, netWorth: 38_600_000, liquidity: 4_850_000, pfsDate: "2026-06-30", unitsDelivered: 0, activeProjects: 6, focus: ["Industrial", "Flex"], rating: "A" },
  { id: "linden", name: "Linden Avenue Capital", principal: "David Okafor", hq: "Silver Spring, MD", founded: 2014, netWorth: 21_400_000, liquidity: 2_700_000, pfsDate: "2026-08-31", unitsDelivered: 410, activeProjects: 5, focus: ["Retail", "Multifamily"], rating: "A" },
  { id: "arbor", name: "Arbor & Vine Homes", principal: "Rachel Lindqvist", hq: "Arlington, VA", founded: 2016, netWorth: 17_900_000, liquidity: 2_250_000, pfsDate: "2026-07-31", unitsDelivered: 285, activeProjects: 3, focus: ["Build-to-rent", "Townhomes"], rating: "B+" },
  { id: "kensington", name: "Kensington Row Partners", principal: "Tom Brennan", hq: "Philadelphia, PA", founded: 2018, netWorth: 6_300_000, liquidity: 610_000, pfsDate: "2026-05-31", unitsDelivered: 120, activeProjects: 2, focus: ["Multifamily"], rating: "B" },
  { id: "christina", name: "Christina River Storage Co.", principal: "Priya Natarajan", hq: "Wilmington, DE", founded: 2012, netWorth: 12_800_000, liquidity: 1_400_000, pfsDate: "2026-06-30", unitsDelivered: 0, activeProjects: 3, focus: ["Self-storage"], rating: "B+" },
  { id: "elmcalvert", name: "Elm & Calvert Medical Properties", principal: "Samir Haddad", hq: "Columbia, MD", founded: 2010, netWorth: 9_700_000, liquidity: 980_000, pfsDate: "2026-04-30", unitsDelivered: 0, activeProjects: 2, focus: ["Medical office"], rating: "B" },
  { id: "scottsrow", name: "Scott's Row Entertainment Holdings", principal: "Alicia Moreno", hq: "Richmond, VA", founded: 2015, netWorth: 15_100_000, liquidity: 1_650_000, pfsDate: "2026-07-31", unitsDelivered: 0, activeProjects: 3, focus: ["Entertainment", "Food & beverage"], rating: "B+" },
  { id: "halcyon", name: "Halcyon Hospitality Group", principal: "Jonathan Pierce", hq: "Washington, DC", founded: 2009, netWorth: 27_500_000, liquidity: 3_100_000, pfsDate: "2026-06-30", unitsDelivered: 0, activeProjects: 5, focus: ["Hospitality"], rating: "B+" },
  { id: "severn", name: "Severn Harbor Developers", principal: "Grace Whitfield", hq: "Annapolis, MD", founded: 2013, netWorth: 19_300_000, liquidity: 2_050_000, pfsDate: "2026-09-30", unitsDelivered: 330, activeProjects: 4, focus: ["Mixed-use", "Waterfront"], rating: "A" },
  { id: "ghent", name: "Ghent Lane Residential", principal: "Wesley Carter", hq: "Norfolk, VA", founded: 2017, netWorth: 11_200_000, liquidity: 1_300_000, pfsDate: "2026-08-31", unitsDelivered: 260, activeProjects: 3, focus: ["Multifamily"], rating: "B+" },
  { id: "rolandpark", name: "Roland Park Retail Partners", principal: "Nina Feldman", hq: "Baltimore, MD", founded: 2006, netWorth: 24_800_000, liquidity: 2_900_000, pfsDate: "2026-06-30", unitsDelivered: 0, activeProjects: 6, focus: ["Neighborhood retail"], rating: "A" },
];

export const SPONSOR: Record<string, Sponsor> = Object.fromEntries(SPONSORS.map((s) => [s.id, s]));

export const BROKERS: Broker[] = [
  { id: "northbay", firm: "Northbay Capital Advisors", contact: "Kevin Marsh", title: "Managing Director", city: "Baltimore, MD", dealsSourced: 14, dealsClosed: 4 },
  { id: "keystone", firm: "Keystone Debt Partners", contact: "Laura Chen", title: "Director, Debt & Equity", city: "Philadelphia, PA", dealsSourced: 9, dealsClosed: 2 },
  { id: "potomac", firm: "Potomac Commercial Finance", contact: "Andre Wallace", title: "Senior Vice President", city: "Washington, DC", dealsSourced: 11, dealsClosed: 3 },
  { id: "harborstreet", firm: "Harbor Street Capital", contact: "Megan O'Rourke", title: "Principal", city: "Annapolis, MD", dealsSourced: 6, dealsClosed: 2 },
  { id: "direct", firm: "Direct (no broker)", contact: "Sponsor-direct", title: "—", city: "—", dealsSourced: 7, dealsClosed: 3 },
];

export const BROKER: Record<string, Broker> = Object.fromEntries(BROKERS.map((b) => [b.id, b]));
