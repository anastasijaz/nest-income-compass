import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, UserRound } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSheet } from "@/components/app/FormSheet";
import { Field, inputLg } from "@/components/app/fields";
import { amountInput, formatEUR as eur, parseAmount } from "@/lib/finance";
import { recurringRentsQuery, useRefresh, type RecurringRent } from "@/lib/queries";

export function TenantRents({ propertyId, tenants }: { propertyId: string; tenants: number }) {
  const q = useQuery(recurringRentsQuery);
  const [editing, setEditing] = useState<RecurringRent | "new" | null>(null);
  if (tenants <= 0) return null;
  const rows = (q.data ?? []).filter(
    (r) => r.property_id === propertyId && r.active && r.tenant_name,
  );
  const total = rows.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-semibold">Tenant rent (Miete)</h2>
          <p className="text-xs text-muted-foreground">
            {rows.length} of {tenants} tenant{tenants === 1 ? "" : "s"} · {eur(total)} / month
          </p>
        </div>
        <Button variant="outline" className="h-11" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> Tenant
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add each tenant's monthly rent — it's added as income automatically every month.
        </p>
      ) : (
        <ul className="divide-y">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                className="flex w-full items-center gap-3 py-3 text-left"
                onClick={() => setEditing(r)}
              >
                <UserRound className="h-5 w-5 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.tenant_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Monthly on day {r.day_of_month} · since{" "}
                    {format(parseISO(r.start_date), "d MMM yyyy")}
                  </p>
                </div>
                <span className="font-medium tabular-nums">{eur(Number(r.amount))}</span>
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <TenantSheet
          propertyId={propertyId}
          rent={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}

function TenantSheet({
  propertyId,
  rent,
  onClose,
}: {
  propertyId: string;
  rent: RecurringRent | null;
  onClose: () => void;
}) {
  const refresh = useRefresh();
  const [name, setName] = useState(rent?.tenant_name ?? "");
  const [amount, setAmount] = useState(amountInput(rent?.amount));
  const [start, setStart] = useState(rent?.start_date ?? format(new Date(), "yyyy-MM-dd"));
  const [busy, setBusy] = useState(false);

  async function save() {
    const value = parseAmount(amount);
    if (!name.trim()) return void toast.error("Enter the tenant's name");
    if (!(value > 0)) return void toast.error("Enter the monthly rent");
    setBusy(true);
    const row = {
      tenant_name: name.trim(),
      amount: value,
      note: `Miete – ${name.trim()}`,
    };
    const { error } = rent
      ? await supabase.from("recurring_rents").update(row).eq("id", rent.id)
      : await supabase.from("recurring_rents").insert({
          ...row,
          property_id: propertyId,
          start_date: start,
          day_of_month: Math.min(28, Number(start.slice(8, 10))),
        });
    if (!error) await supabase.rpc("generate_recurring_rent");
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Tenant rent saved");
    refresh();
    onClose();
  }

  async function stop() {
    if (!rent || !confirm("Stop adding this tenant's rent from now on? Past rent stays recorded."))
      return;
    const { error } = await supabase
      .from("recurring_rents")
      .update({ active: false })
      .eq("id", rent.id);
    if (error) return void toast.error(error.message);
    refresh();
    onClose();
  }

  return (
    <FormSheet
      open
      onOpenChange={(o) => !o && onClose()}
      title={rent ? "Edit tenant rent" : "Add tenant rent"}
      onSubmit={save}
      busy={busy}
      extraActions={
        rent ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12 rounded-xl"
            onClick={stop}
          >
            Stop rent
          </Button>
        ) : undefined
      }
    >
      <Field label="Tenant name">
        <Input className={inputLg} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Monthly rent (Miete, €)">
        <Input
          className={inputLg}
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>
      {!rent && (
        <Field label="First payment date">
          <Input
            className={inputLg}
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </Field>
      )}
    </FormSheet>
  );
}
