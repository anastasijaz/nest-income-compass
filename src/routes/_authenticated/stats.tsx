import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PeriodFilter } from "@/components/app/PeriodFilter";
import { formatEUR, inRange, kEUR, periodRange, todayISO, type Period } from "@/lib/finance";
import { propertiesQuery, transactionsQuery } from "@/lib/queries";
import { computeStats } from "@/lib/stats";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/stats")({
  head: () => ({
    meta: [
      { title: "Stats — Rentwise" },
      {
        name: "description",
        content: "Monthly earnings, per-property profit, fix costs and break-even.",
      },
      { property: "og:title", content: "Stats — Rentwise" },
      {
        property: "og:description",
        content: "Monthly earnings, per-property profit, fix costs and break-even.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StatsPage,
});

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | undefined;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          tone === "good" && "text-success",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function StatsPage() {
  const [period, setPeriod] = useState<Period>({ key: "year" });
  const { data: props = [] } = useQuery(propertiesQuery);
  const { data: txns = [] } = useQuery(transactionsQuery);

  const s = useMemo(() => {
    const r = periodRange(period);
    const list = txns.filter((t) => inRange(t.date, r));
    const dates = list.map((t) => t.date).sort();
    const from = r.from ?? dates[0] ?? todayISO();
    const to = r.to ?? todayISO();
    return computeStats(list, props, from, to);
  }, [txns, props, period]);

  const tone = (n: number) => (n > 0 ? "good" : n < 0 ? "bad" : undefined);
  const breakEven =
    s.breakEvenMonth === "always"
      ? "In profit the whole time"
      : s.breakEvenMonth
        ? `Reached in ${s.breakEvenMonth}`
        : s.activeMonths
          ? "Not yet"
          : "—";

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Stats</h1>
      </header>

      <div className="mt-4">
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tile label="Net profit" value={formatEUR(s.total.net)} tone={tone(s.total.net)} />
        <Tile
          label="Average per month"
          value={formatEUR(s.avgNetPerMonth)}
          tone={tone(s.avgNetPerMonth)}
        />
        <Tile
          label="Average per property"
          value={formatEUR(s.avgNetPerProperty)}
          tone={tone(s.avgNetPerProperty)}
        />
        <Tile label="Fixes & renovations" value={formatEUR(s.fixCosts)} />
        <Tile label="Break-even" value={breakEven} />
        <Tile label="Profitable months" value={`${s.profitableMonths} of ${s.activeMonths}`} />
      </section>

      <section className="mt-5 rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="mb-3 font-semibold">Money made each month</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={s.monthly}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={12}
              />
              <YAxis
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={kEUR}
              />
              <Tooltip formatter={(v: number) => formatEUR(v)} />
              <Bar dataKey="income" name="Income" fill="var(--chart-income)" radius={4} />
              <Bar dataKey="costs" name="Costs" fill="var(--chart-cost)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="mb-1 font-semibold">Running total</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Above zero means you have earned back everything spent in this period.
        </p>
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={s.monthly}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={12}
              />
              <YAxis
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={kEUR}
              />
              <Tooltip formatter={(v: number) => formatEUR(v)} />
              <Line
                dataKey="cumulative"
                name="Running total"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border bg-card shadow-card">
        <h2 className="p-4 pb-2 font-semibold">Each property</h2>
        <ul className="divide-y">
          {s.perProperty.map((p) => (
            <li key={p.id}>
              <Link
                to="/properties/$id"
                params={{ id: p.id }}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    In {formatEUR(p.income)} · Out {formatEUR(p.costs)} · Fixes {formatEUR(p.fixes)}
                  </div>
                </div>
                <div
                  className={cn(
                    "shrink-0 font-semibold tabular-nums",
                    p.net > 0 && "text-success",
                    p.net < 0 && "text-destructive",
                  )}
                >
                  {formatEUR(p.net)}
                </div>
              </Link>
            </li>
          ))}
          {!s.perProperty.length && (
            <li className="px-4 py-6 text-sm text-muted-foreground">No properties yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
