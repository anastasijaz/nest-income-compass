import { format, startOfMonth, subMonths, startOfYear, parseISO, addMonths } from "date-fns";

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
/** Formats as 1.234,56 € */
export function formatEUR(n: number) {
  return eur.format(Number.isFinite(n) ? n : 0);
}

/** Short chart-axis label: 850 → "850", 12400 → "12.4k". */
export function kEUR(n: number) {
  return Math.abs(n) >= 1000 ? `${Math.round(n / 100) / 10}k` : String(Math.round(n));
}

/**
 * Parses a typed euro amount. "1.234,56" and "1234,56" use the German format; without a comma,
 * a single dot followed by 1–2 digits is a decimal point (phone keypads in English locales show "."),
 * otherwise dots group thousands ("1.200" = 1200).
 */
export function parseAmount(s: string) {
  const t = s.trim().replace(/[\s€]/g, "");
  if (!t) return NaN;
  if (t.includes(",")) return Number(t.replace(/\./g, "").replace(",", "."));
  return /^\d*\.\d{1,2}$/.test(t) ? Number(t) : Number(t.replace(/\./g, ""));
}

/** Formats a stored number for an amount input, e.g. 1200.5 → "1200,50". */
export function amountInput(n: number | string | null | undefined) {
  if (n == null || n === "") return "";
  const v = Number(n);
  return Number.isFinite(v) ? v.toFixed(2).replace(".", ",") : "";
}

export const todayISO = () => format(new Date(), "yyyy-MM-dd");

export type PeriodKey = "month" | "3months" | "year" | "all" | "custom";
export interface Period {
  key: PeriodKey;
  from?: string | undefined;
  to?: string | undefined;
}
export const PERIOD_LABELS: Record<PeriodKey, string> = {
  month: "This month",
  "3months": "Last 3 months",
  year: "This year",
  all: "All time",
  custom: "Custom",
};

/** Returns inclusive ISO date bounds; undefined bound = open. */
export function periodRange(
  p: Period,
  now = new Date(),
): { from?: string | undefined; to?: string | undefined } {
  const iso = (d: Date) => format(d, "yyyy-MM-dd");
  switch (p.key) {
    case "month":
      return { from: iso(startOfMonth(now)), to: iso(now) };
    case "3months":
      return { from: iso(startOfMonth(subMonths(now, 2))), to: iso(now) };
    case "year":
      return { from: iso(startOfYear(now)), to: iso(now) };
    case "all":
      return {};
    case "custom":
      return { from: p.from || undefined, to: p.to || undefined };
  }
}

export function inRange(date: string, r: { from?: string | undefined; to?: string | undefined }) {
  return (!r.from || date >= r.from) && (!r.to || date <= r.to);
}

export interface Txn {
  kind: string;
  amount: number;
  date: string;
}

export function summarize(txns: Txn[]) {
  let income = 0;
  let costs = 0;
  for (const t of txns) {
    if (t.kind === "income") income += Number(t.amount);
    else costs += Number(t.amount);
  }
  const net = income - costs;
  const covering = income >= costs;
  const coverage = costs === 0 ? (income > 0 ? 100 : 0) : Math.round((income / costs) * 100);
  return { income, costs, net, covering, coverage };
}

export function monthlyBuckets(txns: Txn[], from: string, to: string) {
  const out: { month: string; label: string; income: number; costs: number }[] = [];
  let d = startOfMonth(parseISO(from));
  const end = parseISO(to);
  let guard = 0;
  while (d <= end && guard++ < 240) {
    const key = format(d, "yyyy-MM");
    out.push({ month: key, label: format(d, "MMM yy"), income: 0, costs: 0 });
    d = addMonths(d, 1);
  }
  const map = new Map(out.map((b) => [b.month, b]));
  for (const t of txns) {
    const b = map.get(t.date.slice(0, 7));
    if (!b) continue;
    if (t.kind === "income") b.income += Number(t.amount);
    else b.costs += Number(t.amount);
  }
  return out;
}

export const INCOME_CATEGORIES = {
  rent: "Rent",
  deposit: "Deposit",
  utility_reimbursement: "Utility reimbursement",
  other: "Other",
} as const;

export const COST_CATEGORIES = {
  repairs: "Repairs",
  maintenance: "Maintenance",
  utilities: "Utilities",
  energy: "Energy / electricity",
  heating: "Heating",
  insurance: "Insurance",
  property_tax: "Property tax",
  mortgage: "Mortgage / loan",
  management_fees: "Management fees",
  other: "Other",
} as const;

export const PROPERTY_TYPES = {
  apartment: "Apartment",
  house: "House",
  studio: "Studio",
  commercial: "Commercial",
  other: "Other",
} as const;

export const TAX_TYPES = {
  grundsteuer: "Grundsteuer",
  income_tax: "Income tax on rent",
  other: "Other",
} as const;

export function categoryLabel(kind: string, cat: string) {
  const map: Record<string, string> = kind === "income" ? INCOME_CATEGORIES : COST_CATEGORIES;
  return map[cat] ?? cat;
}

export function isOverdue(t: { status: string; due_date: string }, today = todayISO()) {
  return t.status !== "paid" && t.due_date < today;
}
