import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowLeft, Building2, Check, Pencil, Plus, Receipt, RotateCcw, Users, Wrench, Landmark } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodFilter } from "@/components/app/PeriodFilter";
import { Photo } from "@/components/app/Photo";
import { PropertySheet } from "@/components/app/PropertySheet";
import { QuickAdd } from "@/components/app/QuickAdd";
import { CoverageBadge, CoverageBar } from "@/components/app/Status";
import { TransactionSheet, type TxnKind } from "@/components/app/TransactionSheet";
import { CompleteFixSheet, FixSheet, reopenFix } from "@/components/app/FixSheets";
import { PayTaxSheet, TaxSheet, unpayTax } from "@/components/app/TaxSheets";
import {
  categoryLabel,
  formatEUR,
  inRange,
  isOverdue,
  monthlyBuckets,
  periodRange,
  PROPERTY_TYPES,
  summarize,
  TAX_TYPES,
  todayISO,
  type Period,
} from "@/lib/finance";
import { fixesQuery, propertiesQuery, taxesQuery, transactionsQuery, useRefresh, type Fix, type Tax, type Transaction } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/properties/$id")({
  head: () => ({
    meta: [
      { title: "Property — Rentwise" },
      { name: "description", content: "Income, costs, fixes and taxes for this property." },
      { property: "og:title", content: "Property — Rentwise" },
      { property: "og:description", content: "Income, costs, fixes and taxes for this property." },
    ],
  }),
  component: PropertyPage,
});

const fmtDate = (d: string) => format(parseISO(d), "d MMM yyyy");

function PropertyPage() {
  const { id } = Route.useParams();
  const [period, setPeriod] = useState<Period>({ key: "year" });
  const [editing, setEditing] = useState(false);
  const props = useQuery(propertiesQuery);
  const txnsQ = useQuery(transactionsQuery);
  const fixesQ = useQuery(fixesQuery);
  const taxesQ = useQuery(taxesQuery);
  const p = props.data?.find((x) => x.id === id);

  const allTxns = useMemo(() => (txnsQ.data ?? []).filter((t) => t.property_id === id), [txnsQ.data, id]);
  const range = periodRange(period);
  const txns = useMemo(() => allTxns.filter((t) => inRange(t.date, range)), [allTxns, range.from, range.to]);
  const s = summarize(txns);
  const chart = useMemo(() => {
    const from = range.from ?? allTxns[allTxns.length - 1]?.date ?? todayISO();
    const to = range.to ?? todayISO();
    return from <= to ? monthlyBuckets(txns, from, to) : [];
  }, [txns, allTxns, range.from, range.to]);

  if (props.isLoading) return <div className="mx-auto h-72 max-w-3xl animate-pulse bg-muted" />;
  if (!p)
    return (
      <div className="p-10 text-center">
        <p>Property not found.</p>
        <Link to="/dashboard" className="mt-4 inline-block underline">
          Back to properties
        </Link>
      </div>
    );

  const fixes = (fixesQ.data ?? []).filter((f) => f.property_id === id);
  const taxes = (taxesQ.data ?? []).filter((t) => t.property_id === id);

  return (
    <div className="mx-auto min-h-dvh max-w-3xl pb-32">
      <div className="relative">
        <Photo path={p.photo_path} alt={p.name} className="aspect-[16/9] max-h-72 w-full md:rounded-b-3xl" fallback={<Building2 className="h-10 w-10" />} />
        <div className="absolute inset-x-0 top-0 flex justify-between p-4">
          <Link to="/dashboard" aria-label="Back" className="flex h-11 w-11 items-center justify-center rounded-full bg-card/95 shadow-card">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <button onClick={() => setEditing(true)} aria-label="Edit property" className="flex h-11 w-11 items-center justify-center rounded-full bg-card/95 shadow-card">
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-5 px-4 pt-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{p.name}</h1>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {PROPERTY_TYPES[p.property_type as keyof typeof PROPERTY_TYPES] ?? p.property_type}
            </span>
          </div>
          {p.address && <p className="text-muted-foreground">{p.address}</p>}
          <div className="mt-2 flex gap-4 text-sm">
            <span className="tabular">{formatEUR(Number(p.monthly_rent))}/mo</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> {p.tenants} {p.tenants === 1 ? "tenant" : "tenants"}
            </span>
          </div>
        </div>

        <PeriodFilter value={period} onChange={setPeriod} />

        <section className="space-y-4 rounded-2xl border bg-card p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Net result</p>
              <p className={cn("tabular text-3xl font-semibold", s.net < 0 && "text-destructive")}>{formatEUR(s.net)}</p>
            </div>
            <CoverageBadge covering={s.covering} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-chart-income" /> Income <span className="tabular ml-auto font-medium">{formatEUR(s.income)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-chart-cost" /> Costs <span className="tabular ml-auto font-medium">{formatEUR(s.costs)}</span>
            </div>
          </div>
          <CoverageBar coverage={s.coverage} covering={s.covering} hasCosts={s.costs > 0} />
          {chart.length > 0 && (
            <div className="-ml-2 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} barGap={2}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} width={48} stroke="var(--muted-foreground)" tickFormatter={(v) => `${Math.round(v / 100) / 10}k`} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    formatter={(v: number) => formatEUR(v)}
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}
                  />
                  <Bar dataKey="income" name="Income" fill="var(--chart-income)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="costs" name="Costs" fill="var(--chart-cost)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <Tabs defaultValue="transactions">
          <TabsList className="grid h-12 w-full grid-cols-3 rounded-xl">
            <TabsTrigger value="transactions" className="h-10 rounded-lg">Transactions</TabsTrigger>
            <TabsTrigger value="fixes" className="h-10 rounded-lg">Fixes</TabsTrigger>
            <TabsTrigger value="taxes" className="h-10 rounded-lg">
              Taxes {taxes.some((t) => isOverdue(t)) && <AlertTriangle className="ml-1 h-3.5 w-3.5 text-destructive" />}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="transactions" className="mt-4">
            <TransactionsTab propertyId={id} txns={txns} />
          </TabsContent>
          <TabsContent value="fixes" className="mt-4">
            <FixesTab propertyId={id} fixes={fixes} />
          </TabsContent>
          <TabsContent value="taxes" className="mt-4">
            <TaxesTab propertyId={id} taxes={taxes} />
          </TabsContent>
        </Tabs>
      </div>

      <PropertySheet open={editing} onOpenChange={setEditing} property={p} />
      <QuickAdd propertyId={id} />
    </div>
  );
}

function Empty({ icon, title, text, children }: { icon: React.ReactNode; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{text}</p>
      {children && <div className="mt-5 flex gap-2">{children}</div>}
    </div>
  );
}

function TransactionsTab({ propertyId, txns }: { propertyId: string; txns: Transaction[] }) {
  const [sheet, setSheet] = useState<{ kind: TxnKind; txn?: Transaction } | null>(null);
  return (
    <>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-12 rounded-xl" onClick={() => setSheet({ kind: "income" })}>
          <Plus className="h-4 w-4" /> Income
        </Button>
        <Button variant="outline" className="h-12 rounded-xl" onClick={() => setSheet({ kind: "cost" })}>
          <Plus className="h-4 w-4" /> Cost
        </Button>
      </div>
      {txns.length === 0 ? (
        <Empty icon={<Receipt className="h-8 w-8" />} title="No transactions in this period" text="Add rent you've received or a cost you've paid. You can also scan a receipt." />
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {txns.map((t) => (
            <li key={t.id}>
              <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setSheet({ kind: t.kind as TxnKind, txn: t })}>
                <Photo path={t.receipt_path} alt="Receipt" className="h-11 w-11 shrink-0 rounded-lg" fallback={<Receipt className="h-4 w-4" />} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {categoryLabel(t.kind, t.category)}
                    {t.vendor && <span className="font-normal text-muted-foreground"> · {t.vendor}</span>}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {fmtDate(t.date)}
                    {t.note && ` · ${t.note}`}
                    {t.recurring_id && " · Monthly"}
                  </p>
                </div>
                <span className="tabular shrink-0 font-semibold">
                  {t.kind === "income" ? "+" : "−"}
                  {formatEUR(Number(t.amount))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <TransactionSheet open={!!sheet} onOpenChange={(o) => !o && setSheet(null)} kind={sheet?.kind ?? "cost"} txn={sheet?.txn} propertyId={propertyId} />
    </>
  );
}

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-primary text-primary-foreground",
  medium: "bg-accent text-accent-foreground",
  low: "bg-muted text-muted-foreground",
};

function FixesTab({ propertyId, fixes }: { propertyId: string; fixes: Fix[] }) {
  const refresh = useRefresh();
  const [edit, setEdit] = useState<{ fix?: Fix } | null>(null);
  const [complete, setComplete] = useState<Fix | null>(null);
  const sorted = [...fixes].sort((a, b) => (a.status === b.status ? 0 : a.status === "todo" ? -1 : 1));
  return (
    <>
      <Button variant="outline" className="mb-3 h-12 w-full rounded-xl" onClick={() => setEdit({})}>
        <Plus className="h-4 w-4" /> Add fix
      </Button>
      {fixes.length === 0 ? (
        <Empty icon={<Wrench className="h-8 w-8" />} title="Nothing to fix" text="Note repairs as they come up. When you mark one done, its cost is recorded automatically." />
      ) : (
        <ul className="space-y-2">
          {sorted.map((f) => (
            <li key={f.id} className={cn("flex gap-3 rounded-2xl border bg-card p-3", f.status === "done" && "opacity-70")}>
              <button className="flex min-w-0 flex-1 gap-3 text-left" onClick={() => setEdit({ fix: f })}>
                <Photo path={f.photo_path} alt={f.title} className="h-14 w-14 shrink-0 rounded-xl" fallback={<Wrench className="h-5 w-5" />} />
                <div className="min-w-0">
                  <p className={cn("truncate font-medium", f.status === "done" && "line-through")}>{f.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span className={cn("rounded px-1.5 py-0.5 font-medium capitalize", PRIORITY_STYLE[f.priority])}>{f.priority}</span>
                    <span>{fmtDate(f.created_at.slice(0, 10))}</span>
                    {f.status === "done"
                      ? f.actual_cost != null && <span className="tabular">Paid {formatEUR(Number(f.actual_cost))}</span>
                      : f.estimated_cost != null && <span className="tabular">Est. {formatEUR(Number(f.estimated_cost))}</span>}
                  </div>
                  {f.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{f.description}</p>}
                </div>
              </button>
              {f.status === "todo" ? (
                <Button size="sm" className="h-11 shrink-0 self-center rounded-xl" onClick={() => setComplete(f)}>
                  <Check className="h-4 w-4" /> Done
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-11 w-11 shrink-0 self-center"
                  aria-label="Reopen fix"
                  onClick={async () => {
                    if (!confirm("Reopen this fix? Its recorded cost will be removed.")) return;
                    const { error } = await reopenFix(f);
                    if (error) toast.error(error.message);
                    refresh();
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <FixSheet open={!!edit} onOpenChange={(o) => !o && setEdit(null)} propertyId={propertyId} fix={edit?.fix} />
      <CompleteFixSheet fix={complete} onOpenChange={(o) => !o && setComplete(null)} />
    </>
  );
}

function TaxesTab({ propertyId, taxes }: { propertyId: string; taxes: Tax[] }) {
  const refresh = useRefresh();
  const [edit, setEdit] = useState<{ tax?: Tax } | null>(null);
  const [pay, setPay] = useState<Tax | null>(null);
  return (
    <>
      <Button variant="outline" className="mb-3 h-12 w-full rounded-xl" onClick={() => setEdit({})}>
        <Plus className="h-4 w-4" /> Add tax
      </Button>
      {taxes.length === 0 ? (
        <Empty icon={<Landmark className="h-8 w-8" />} title="No taxes yet" text="Add Grundsteuer or income tax with its due date and you'll be warned when it's overdue." />
      ) : (
        <ul className="space-y-2">
          {taxes.map((t) => {
            const overdue = isOverdue(t);
            return (
              <li key={t.id} className={cn("flex items-center gap-3 rounded-2xl border bg-card p-3", overdue && "border-destructive bg-destructive-soft")}>
                <button className="min-w-0 flex-1 text-left" onClick={() => setEdit({ tax: t })}>
                  <p className="flex items-center gap-1.5 font-medium">
                    {overdue && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    {t.tax_type === "other" ? t.label || "Other tax" : TAX_TYPES[t.tax_type as keyof typeof TAX_TYPES]}
                  </p>
                  <p className={cn("text-sm text-muted-foreground", overdue && "font-medium text-destructive")}>
                    <span className="tabular">{formatEUR(Number(t.amount))}</span> ·{" "}
                    {t.status === "paid" && t.paid_at ? `Paid ${fmtDate(t.paid_at)}` : `${overdue ? "Overdue since" : "Due"} ${fmtDate(t.due_date)}`}
                  </p>
                </button>
                {t.status === "paid" ? (
                  <button
                    className="h-11 shrink-0 rounded-xl px-3 text-sm font-medium text-muted-foreground"
                    onClick={async () => {
                      if (!confirm("Mark as not paid? Its recorded cost will be removed.")) return;
                      const { error } = await unpayTax(t);
                      if (error) toast.error(error.message);
                      refresh();
                    }}
                  >
                    Paid ✓
                  </button>
                ) : (
                  <Button size="sm" variant={overdue ? "destructive" : "default"} className="h-11 shrink-0 rounded-xl" onClick={() => setPay(t)}>
                    Mark paid
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <TaxSheet open={!!edit} onOpenChange={(o) => !o && setEdit(null)} propertyId={propertyId} tax={edit?.tax} />
      <PayTaxSheet tax={pay} onOpenChange={(o) => !o && setPay(null)} />
    </>
  );
}
