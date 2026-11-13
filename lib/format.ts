import { CURRENCIES, RUN, type Currency } from "./data";

export function money(amount: number, currency: Currency = "GMD", opts: { decimals?: boolean } = {}) {
  if (currency === "GMD") return `GMD ${Math.round(amount).toLocaleString("en-GB")}`;
  const c = CURRENCIES.find((x) => x.code === currency)!;
  const n = opts.decimals ? amount.toFixed(2) : Math.round(amount).toLocaleString("en-GB");
  return c.code === "SEK" ? `${n} kr` : `${c.symbol}${n}`;
}

export function compactGMD(n: number) {
  if (n >= 1_000_000) return `GMD ${parseFloat((n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 2))}m`;
  if (n >= 1000) return `GMD ${(n / 1000).toFixed(0)}k`;
  return `GMD ${n}`;
}

/** Suggested amount for someone abroad, in their currency, rounded to a friendly number. */
export function suggested(gbp: number, currency: Currency) {
  const c = CURRENCIES.find((x) => x.code === currency) ?? CURRENCIES[0];
  const raw = gbp * c.perGBP;
  const step = currency === "SEK" ? 50 : 5;
  return Math.max(step, Math.round(raw / step) * step);
}

/** Age on race day from a DD/MM/YYYY date of birth. */
export function raceDayAge(dob: string): number | null {
  const m = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m.map(Number) as unknown as [number, number, number, number];
  const birth = new Date(Date.UTC(y, mo - 1, d));
  if (Number.isNaN(birth.getTime()) || birth.getUTCDate() !== d) return null;
  const race = new Date(RUN.dateISO);
  let age = race.getUTCFullYear() - y;
  if (race.getUTCMonth() < mo - 1 || (race.getUTCMonth() === mo - 1 && race.getUTCDate() < d)) age--;
  return age >= 0 && age < 110 ? age : null;
}

export function category(age: number | null, gender: string) {
  if (age === null) return null;
  if (age < 18) return "Under 18";
  const who = gender === "Male" ? "Men" : gender === "Female" ? "Women" : "Open";
  if (age < 25) return `${who} 18 to 24`;
  const lo = Math.floor(age / 5) * 5;
  if (lo >= 70) return `${who} 70 and over`;
  return `${who} ${lo} to ${lo + 4}`;
}

export const COUNTRY_CODES = [
  { iso: "GM", dial: "+220", name: "The Gambia", pattern: [2, 3, 4], sample: "87 765 4321" },
  { iso: "GB", dial: "+44", name: "United Kingdom", pattern: [4, 6], sample: "7911 123456" },
  { iso: "US", dial: "+1", name: "United States", pattern: [3, 3, 4], sample: "404 555 0137" },
  { iso: "SE", dial: "+46", name: "Sweden", pattern: [2, 3, 2, 2], sample: "70 123 45 67" },
  { iso: "ES", dial: "+34", name: "Spain", pattern: [3, 3, 3], sample: "612 345 678" },
  { iso: "DE", dial: "+49", name: "Germany", pattern: [4, 7], sample: "1512 3456789" },
  { iso: "FR", dial: "+33", name: "France", pattern: [1, 2, 2, 2, 2], sample: "6 12 34 56 78" },
  { iso: "SN", dial: "+221", name: "Senegal", pattern: [2, 3, 2, 2], sample: "77 123 45 67" },
  { iso: "NG", dial: "+234", name: "Nigeria", pattern: [3, 3, 4], sample: "803 123 4567" },
];

export function formatPhone(digits: string, iso: string) {
  const c = COUNTRY_CODES.find((x) => x.iso === iso) ?? COUNTRY_CODES[0];
  const max = c.pattern.reduce((a, b) => a + b, 0);
  const d = digits.replace(/\D/g, "").slice(0, max);
  const parts: string[] = [];
  let i = 0;
  for (const len of c.pattern) {
    if (i >= d.length) break;
    parts.push(d.slice(i, i + len));
    i += len;
  }
  return parts.join(" ");
}

export function phoneMax(iso: string) {
  const c = COUNTRY_CODES.find((x) => x.iso === iso) ?? COUNTRY_CODES[0];
  return c.pattern.reduce((a, b) => a + b, 0);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function padBib(n: number) {
  return n < 1000 ? String(n).padStart(4, "0") : String(n);
}
