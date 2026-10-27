// Formatting helpers. All formatting is locale-pinned and timezone-pinned (UTC)
// so server and client renders match exactly.

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const num0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function money(n: number): string {
  return usd0.format(Math.round(n));
}

export function moneyShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) {
    const v = n / 1_000_000;
    if (v >= 100) return `$${v.toFixed(0)}MM`;
    const two = v.toFixed(2);
    return `$${two.endsWith("0") ? v.toFixed(1) : two}MM`;
  }
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return money(n);
}

export function int(n: number): string {
  return num0.format(Math.round(n));
}

export function pct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

export function times(n: number, digits = 2): string {
  return `${n.toFixed(digits)}x`;
}

export function bps(n: number): string {
  return `${Math.round(n)} bps`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function date(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function dateShort(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function dateTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${h12}:${m} ${ampm}`;
}

export function time(iso: string): string {
  const d = new Date(iso);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

// Fixed demo "today" so relative times are stable for every viewer.
export const DEMO_TODAY = "2026-10-27T15:00:00.000Z";

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export function daysAgo(iso: string): number {
  return daysBetween(iso, DEMO_TODAY);
}

export function relative(iso: string): string {
  const mins = Math.round((new Date(DEMO_TODAY).getTime() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return date(iso);
}

export function formatValue(
  value: number | string,
  format: "money" | "pct" | "date" | "text" | "int" | "x",
): string {
  if (typeof value === "string") {
    if (format === "date") return date(value);
    return value;
  }
  switch (format) {
    case "money":
      return money(value);
    case "pct":
      return pct(value);
    case "int":
      return int(value);
    case "x":
      return times(value);
    default:
      return String(value);
  }
}

const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function moneyCents(n: number): string {
  return usd2.format(n);
}
