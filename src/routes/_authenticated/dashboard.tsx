import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, Building2, CalendarDays, Filter, ListChecks, LogOut, Plus, Users, UsersRound, Wrench, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PeriodFilter } from "@/components/app/PeriodFilter";
import { Photo } from "@/components/app/Photo";
import { PropertySheet } from "@/components/app/PropertySheet";
import { QuickAdd } from "@/components/app/QuickAdd";
import { CoverageBadge, CoverageBar } from "@/components/app/Status";
import { formatEUR, inRange, isOverdue, periodRange, PROPERTY_TYPES, summarize, type Period } from "@/lib/finance";
import { fixesQuery, propertiesQuery, taxesQuery, transactionsQuery, type Property } from "@/lib/queries";
import { PropertyFilterBar } from "@/components/app/PropertyFilter";
import { countryFilterOptions, EMPTY_FILTER, filterProperties, isFilterActive, type PropertyFilter } from "@/lib/property-filter";
import { countryLabel } from "@/lib/countries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Properties — Rentwise" },
      { name: "description", content: "All your rental properties at a glance." },
      { property: "og:title", content: "Properties — Rentwise" },
      { property: "og:description", content: "All your rental properties at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>({ key: "month" });
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<PropertyFilter>(EMPTY_FILTER);
  const props = useQuery(propertiesQuery);
  const txns = useQuery(transactionsQuery);
  const fixes = useQuery(fixesQuery);
  const taxes = useQuery(taxesQuery);

  const range = periodRange(period);
  const inPeriod = useMemo(() => (txns.data ?? []).filter((t) => inRange(t.date, range)), [txns.data, range.from, range.to]);
  const total = summarize(inPeriod);

  const netBy = useMemo(() => {
    const groups = new Map<string, { kind: string; amount: number; date: string }[]>();
    for (const t of inPeriod) {
      const id = t.property_id ?? "";
      const list = groups.get(id);
      if (list) list.push(t);
      else groups.set(id, [t]);
    }
    return new Map([...groups].map(([id, list]) => [id, summarize(list).net]));
  }, [inPeriod]);

  const visible = useMemo(
    () => filterProperties(props.data ?? [], filter, (p) => netBy.get(p.id) ?? 0),
    [props.data, filter, netBy],
  );
  const countries = useMemo(() => countryFilterOptions(props.data ?? []), [props.data]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 pb-32 pt-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Properties</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="h-16 w-16 [&_svg]:size-9" aria-label="Tasks">
            <Link to="/tasks"><ListChecks strokeWidth={1.5} /></Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-16 w-16 [&_svg]:size-9" aria-label="Stats">
            <Link to="/stats"><BarChart3 strokeWidth={1.5} /></Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-16 w-16 [&_svg]:size-9" aria-label="Visits calendar">
            <Link to="/calendar"><CalendarDays strokeWidth={1.5} /></Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-16 w-16 [&_svg]:size-9" aria-label="Team">
            <Link to="/team"><UsersRound strokeWidth={1.5} /></Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-16 w-16 [&_svg]:size-9" onClick={signOut} aria-label="Sign out">
            <LogOut strokeWidth={1.5} />
          </Button>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border bg-border shadow-card">
        {[
          ["Income", total.income],
          ["Costs", total.costs],
          ["Net", total.net],
        ].map(([l, v]) => (
          <div key={l as string} className="bg-card px-3 py-4">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className={cn("tabular mt-1 truncate text-base font-semibold sm:text-xl", l === "Net" && (v as number) < 0 && "text-destructive")}>
              {formatEUR(v as number)}
            </p>
          </div>
        ))}
      </section>

      <div className="mt-5">
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {!!props.data?.length && (
        <PropertyFilterBar value={filter} onChange={setFilter} countryOptions={countries} shown={visible.length} total={props.data.length} />
      )}


      {props.isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : !props.data?.length ? (
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed bg-card px-6 py-14 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Add your first property</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">Start with a name and the monthly rent. You can add income, costs and fixes after.</p>
          <Button className="mt-6 h-12 rounded-xl px-6" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add property
          </Button>
        </div>
      ) : !visible.length ? (
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed bg-card px-6 py-14 text-center">
          <Filter className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">No properties match</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">Nothing fits the filters you picked. Try widening them.</p>
          <Button className="mt-6 h-12 rounded-xl px-6" onClick={() => setFilter(EMPTY_FILTER)}>
            <X className="h-4 w-4" /> Clear filters
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <PropertyCard
              key={p.id}
              p={p}
              txns={inPeriod.filter((t) => t.property_id === p.id)}
              openFixes={(fixes.data ?? []).filter((f) => f.property_id === p.id && f.status !== "done").length}
              overdue={(taxes.data ?? []).some((t) => t.property_id === p.id && isOverdue(t))}
            />
          ))}
        </div>
      )}

      <PropertySheet open={adding} onOpenChange={setAdding} />
      <QuickAdd />
    </div>
  );
}

function PropertyCard({ p, txns, openFixes, overdue }: { p: Property; txns: { kind: string; amount: number; date: string }[]; openFixes: number; overdue: boolean }) {
  const s = summarize(txns);
  return (
    <Link to="/properties/$id" params={{ id: p.id }} className="block overflow-hidden rounded-2xl border bg-card shadow-card transition-transform active:scale-[0.99]">
      <div className="relative">
        <Photo path={p.photo_path} alt={p.name} className="aspect-[16/9] w-full" fallback={<Building2 className="h-8 w-8" />} />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {openFixes > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-xs font-medium">
              <Wrench className="h-3.5 w-3.5" /> {openFixes} open {openFixes === 1 ? "fix" : "fixes"}
            </span>
          )}
          {overdue && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground">
              <AlertTriangle className="h-3.5 w-3.5" /> Tax overdue
            </span>
          )}
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold leading-tight">{p.name}</h3>
            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {PROPERTY_TYPES[p.property_type as keyof typeof PROPERTY_TYPES] ?? p.property_type}
            </span>
          </div>
          {(p.address || p.country) && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{[p.address, countryLabel(p.country)].filter(Boolean).join(", ")}</p>
          )}
          <div className="mt-2 flex gap-4 text-sm">
            <span className="tabular">{formatEUR(Number(p.monthly_rent))}/mo</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> {p.tenants} {p.tenants === 1 ? "tenant" : "tenants"}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="tabular font-medium">{formatEUR(s.income)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Costs</p>
            <p className="tabular font-medium">{formatEUR(s.costs)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Net</p>
            <p className={cn("tabular font-semibold", s.net < 0 && "text-destructive")}>{formatEUR(s.net)}</p>
          </div>
        </div>
        <div className="space-y-2">
          <CoverageBadge covering={s.covering} />
          <CoverageBar coverage={s.coverage} covering={s.covering} hasCosts={s.costs > 0} />
        </div>
      </div>
    </Link>
  );
}
