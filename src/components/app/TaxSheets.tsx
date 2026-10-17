import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormSheet } from "./FormSheet";
import { Field, NativeSelect, inputLg } from "./fields";
import { TAX_TYPES, todayISO } from "@/lib/finance";
import { useRefresh, type Tax } from "@/lib/queries";

const num = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));

export function TaxSheet({ open, onOpenChange, propertyId, tax }: { open: boolean; onOpenChange: (o: boolean) => void; propertyId: string; tax?: Tax | undefined }) {
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ tax_type: "grundsteuer", label: "", amount: "", due_date: todayISO() });

  useEffect(() => {
    if (open)
      setF({
        tax_type: tax?.tax_type ?? "grundsteuer",
        label: tax?.label ?? "",
        amount: tax ? String(tax.amount).replace(".", ",") : "",
        due_date: tax?.due_date ?? todayISO(),
      });
  }, [open, tax]);

  async function save() {
    const amount = num(f.amount);
    if (!(amount > 0)) return void toast.error("Enter an amount");
    setBusy(true);
    const row = { property_id: propertyId, tax_type: f.tax_type, label: f.label || null, amount, due_date: f.due_date };
    const { error } = tax ? await supabase.from("taxes").update(row).eq("id", tax.id) : await supabase.from("taxes").insert(row);
    setBusy(false);
    if (error) return void toast.error(error.message);
    refresh();
    onOpenChange(false);
  }

  async function remove() {
    if (!tax || !confirm("Delete this tax item?")) return;
    await supabase.from("taxes").delete().eq("id", tax.id);
    refresh();
    onOpenChange(false);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={tax ? "Edit tax" : "Add tax"}
      onSubmit={save}
      busy={busy}
      extraActions={
        tax && (
          <Button type="button" variant="outline" size="lg" className="h-12 rounded-xl" onClick={remove} aria-label="Delete tax">
            <Trash2 className="h-5 w-5" />
          </Button>
        )
      }
    >
      <Field label="Type">
        <NativeSelect options={TAX_TYPES} value={f.tax_type} onChange={(e) => setF({ ...f, tax_type: e.target.value })} />
      </Field>
      {f.tax_type === "other" && (
        <Field label="Description">
          <Input className={inputLg} value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (€)">
          <Input className={inputLg} inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="0,00" />
        </Field>
        <Field label="Due date">
          <Input className={inputLg} type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} />
        </Field>
      </div>
    </FormSheet>
  );
}

export function PayTaxSheet({ tax, onOpenChange }: { tax: Tax | null; onOpenChange: (o: boolean) => void }) {
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState(todayISO());
  useEffect(() => {
    if (tax) setDate(todayISO());
  }, [tax]);

  async function save() {
    if (!tax) return;
    setBusy(true);
    const { error } = await supabase.from("taxes").update({ status: "paid", paid_at: date }).eq("id", tax.id);
    if (!error) {
      const r = await supabase.from("transactions").insert({
        property_id: tax.property_id,
        kind: "cost",
        amount: tax.amount,
        date,
        category: tax.tax_type === "grundsteuer" ? "property_tax" : "other",
        note: tax.tax_type === "other" ? tax.label || "Tax" : TAX_TYPES[tax.tax_type as keyof typeof TAX_TYPES],
        tax_id: tax.id,
      });
      if (r.error) toast.error(r.error.message);
    }
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Marked paid — cost recorded");
    refresh();
    onOpenChange(false);
  }

  return (
    <FormSheet open={!!tax} onOpenChange={onOpenChange} title="Mark as paid" onSubmit={save} busy={busy} submitLabel="Mark paid">
      <Field label="Payment date">
        <Input className={inputLg} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <p className="text-sm text-muted-foreground">The payment will be added to this property's costs.</p>
    </FormSheet>
  );
}

export async function unpayTax(tax: Tax) {
  await supabase.from("transactions").delete().eq("tax_id", tax.id);
  return supabase.from("taxes").update({ status: "unpaid", paid_at: null }).eq("id", tax.id);
}
