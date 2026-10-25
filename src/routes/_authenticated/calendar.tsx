import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Plus, Trash2 } from "lucide-react";
import { addDays, format, parseISO } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { FormSheet } from "@/components/app/FormSheet";
import { Field, NativeSelect, inputLg } from "@/components/app/fields";
import { todayISO } from "@/lib/finance";
import { meQuery, memberName, membersQuery, propertiesQuery, useRefresh, visitsQuery, type Visit } from "@/lib/queries";
import { memberColor } from "@/lib/memberColor";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Visits — Rentwise" },
      { name: "description", content: "When each person will be visiting the properties." },
      { property: "og:title", content: "Visits — Rentwise" },
      { property: "og:description", content: "When each person will be visiting the properties." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarPage,
});

const fmt = (d: string) => format(parseISO(d), "d MMM yyyy");

function CalendarPage() {
  const { data: visits = [] } = useQuery(visitsQuery);
  const { data: properties = [] } = useQuery(propertiesQuery);
  const { data: members = [] } = useQuery(membersQuery);
  const [sheet, setSheet] = useState<{ visit?: Visit } | null>(null);
  const [showPast, setShowPast] = useState(false);
  const today = todayISO();

  const visitDays = useMemo(() => {
    const days: Date[] = [];
    for (const v of visits) {
      for (let d = parseISO(v.start_date); d <= parseISO(v.end_date) && days.length < 2000; d = new Date(d.getTime() + 86400000)) days.push(d);
    }
    return days;
  }, [visits]);

  const shown = visits.filter((v) => showPast || v.end_date >= today);
  const propName = (id: string) => properties.find((p) => p.id === id)?.name ?? "Property";

  return (
    <div className="mx-auto min-h-dvh max-w-2xl space-y-5 px-4 pb-24 pt-6">
      <header className="flex items-center gap-3">
        <Link to="/dashboard" aria-label="Back" className="flex h-11 w-11 items-center justify-center rounded-full border bg-card">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-2xl font-semibold">Visits</h1>
        <Button className="h-11 rounded-xl" onClick={() => setSheet({})} disabled={!properties.length}>
          <Plus className="h-4 w-4" /> Add visit
        </Button>
      </header>

      <div className="flex justify-center rounded-2xl border bg-card p-2 shadow-card">
        <Calendar
          mode="multiple"
          selected={visitDays}
          onSelect={() => {}}
          className="pointer-events-auto p-3"
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{showPast ? "All visits" : "Upcoming visits"}</h2>
        <button className="h-11 px-2 text-sm text-muted-foreground underline" onClick={() => setShowPast(!showPast)}>
          {showPast ? "Hide past" : "Show past"}
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No visits planned</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">Add the dates you'll be at a property so everyone knows who's going when.</p>
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {shown.map((v) => (
            <li key={v.id}>
              <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setSheet({ visit: v })}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {memberName(members, v.user_id)} <span className="font-normal text-muted-foreground">at</span> {propName(v.property_id)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {v.start_date === v.end_date ? fmt(v.start_date) : `${fmt(v.start_date)} – ${fmt(v.end_date)}`}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <VisitSheet visit={sheet?.visit} open={!!sheet} onOpenChange={(o) => !o && setSheet(null)} />
    </div>
  );
}

function VisitSheet({ visit, open, onOpenChange }: { visit?: Visit | undefined; open: boolean; onOpenChange: (o: boolean) => void }) {
  const refresh = useRefresh();
  const { data: properties = [] } = useQuery(propertiesQuery);
  const { data: members = [] } = useQuery(membersQuery);
  const { data: me = "" } = useQuery(meQuery);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ property_id: "", user_id: "", start_date: todayISO(), end_date: todayISO() });

  useEffect(() => {
    if (open)
      setF({
        property_id: visit?.property_id ?? properties[0]?.id ?? "",
        user_id: visit?.user_id ?? me,
        start_date: visit?.start_date ?? todayISO(),
        end_date: visit?.end_date ?? todayISO(),
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, visit]);

  async function save() {
    if (!f.property_id) return void toast.error("Choose a property");
    if (f.end_date < f.start_date) return void toast.error("End date must be after the start date");
    setBusy(true);
    const { error } = visit ? await supabase.from("visits").update(f).eq("id", visit.id) : await supabase.from("visits").insert(f);
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Visit saved");
    refresh();
    onOpenChange(false);
  }

  async function remove() {
    if (!visit || !confirm("Delete this visit?")) return;
    await supabase.from("visits").delete().eq("id", visit.id);
    refresh();
    onOpenChange(false);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={visit ? "Edit visit" : "Add visit"}
      onSubmit={save}
      busy={busy}
      extraActions={
        visit && (
          <Button type="button" variant="outline" size="lg" className="h-12 rounded-xl" onClick={remove} aria-label="Delete visit">
            <Trash2 className="h-5 w-5" />
          </Button>
        )
      }
    >
      <Field label="Property">
        <NativeSelect options={properties.map((p) => [p.id, p.name] as [string, string])} value={f.property_id} onChange={(e) => setF({ ...f, property_id: e.target.value })} />
      </Field>
      <Field label="Who">
        <NativeSelect options={members.map((m) => [m.user_id, m.display_name || "Member"] as [string, string])} value={f.user_id} onChange={(e) => setF({ ...f, user_id: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="From">
          <Input className={inputLg} type="date" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value, end_date: e.target.value > f.end_date ? e.target.value : f.end_date })} />
        </Field>
        <Field label="To">
          <Input className={inputLg} type="date" value={f.end_date} min={f.start_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} />
        </Field>
      </div>
    </FormSheet>
  );
}
