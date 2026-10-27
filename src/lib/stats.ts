import { monthlyBuckets, summarize } from "./finance";

export interface StatTxn {
  kind: string;
  amount: number;
  date: string;
  property_id: string;
  fix_id: string | null;
  category: string;
}

/** Fix/renovation spend: costs linked to a fix, or booked as repairs/maintenance. */
export function isFixCost(t: StatTxn) {
  return t.kind !== "income" && (!!t.fix_id || t.category === "repairs" || t.category === "maintenance");
}

export function computeStats(txns: StatTxn[], properties: { id: string; name: string }[], from: string, to: string) {
  const total = summarize(txns);
  const months = monthlyBuckets(txns, from, to);
  let running = 0;
  let breakEvenMonth: string | null = null;
  const monthly = months.map((m) => {
    const net = m.income - m.costs;
    const prev = running;
    running += net;
    if (breakEvenMonth === null && prev < 0 && running >= 0) breakEvenMonth = m.label;
    return { ...m, net, cumulative: running };
  });
  const firstLoss = monthly.findIndex((m) => m.cumulative < 0);
  if (firstLoss === -1) breakEvenMonth = monthly.length ? "always" : null;
  else if ((monthly[monthly.length - 1]?.cumulative ?? 0) < 0) breakEvenMonth = null;

  const perProperty = properties
    .map((p) => {
      const s = summarize(txns.filter((t) => t.property_id === p.id));
      const fixes = txns.filter((t) => t.property_id === p.id && isFixCost(t)).reduce((a, t) => a + Number(t.amount), 0);
      return { id: p.id, name: p.name, ...s, fixes };
    })
    .sort((a, b) => b.net - a.net);

  const fixCosts = txns.filter(isFixCost).reduce((a, t) => a + Number(t.amount), 0);
  const n = properties.length;
  const monthsCount = Math.max(1, months.length);
  return {
    total,
    monthly,
    perProperty,
    fixCosts,
    avgNetPerProperty: n ? total.net / n : 0,
    avgNetPerMonth: total.net / monthsCount,
    profitableMonths: monthly.filter((m) => m.net >= 0 && (m.income || m.costs)).length,
    activeMonths: monthly.filter((m) => m.income || m.costs).length,
    breakEvenMonth,
  };
}
