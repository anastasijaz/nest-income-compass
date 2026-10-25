import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, ScanLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormSheet } from "./FormSheet";
import { Field, NativeSelect, inputLg } from "./fields";
import { TAX_TYPES, todayISO } from "@/lib/finance";
import { useRefresh, type Tax } from "@/lib/queries";
import { ImagePicker } from "./ImagePicker";
import { blobToDataUrl, compressImage, uploadImage } from "@/lib/files";
import { parseReceipt } from "@/lib/receipt.functions";

const num = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));

export function TaxSheet({ open, onOpenChange, propertyId, tax, startScan }: { open: boolean; onOpenChange: (o: boolean) => void; propertyId: string; tax?: Tax | undefined; startScan?: boolean | undefined }) {
  const refresh = useRefresh();
  const scan = useServerFn(parseReceipt);
  const scanRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ tax_type: "grundsteuer", label: "", amount: "", due_date: todayISO(), document_date: "", receipt_path: null as string | null });

  useEffect(() => {
    if (open)
      setF({
        tax_type: tax?.tax_type ?? "grundsteuer",
        label: tax?.label ?? "",
        amount: tax ? String(tax.amount).replace(".", ",") : "",
        due_date: tax?.due_date ?? todayISO(),
        document_date: tax?.document_date ?? "",
        receipt_path: tax?.receipt_path ?? null,
      });
    if (open && startScan) {
      const timer = setTimeout(() => scanRef.current?.click(), 150);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open, tax, startScan]);

  async function onScan(file: File) {
    setScanning(true);
    try {
      const blob = await compressImage(file);
      const [path, image] = await Promise.all([uploadImage(blob, "taxes"), blobToDataUrl(blob)]);
      setF((p) => ({ ...p, receipt_path: path }));
      const r = await scan({ data: { image } });
      setF((p) => ({ ...p, document_date: r.date ?? p.document_date,
        amount: r.total != null && (!r.currency || r.currency === "EUR") ? r.total.toFixed(2).replace(".", ",") : p.amount,
        tax_type: r.category === "property_tax" ? "grundsteuer" : "other", label: r.purpose ?? p.label }));
      if (r.currency && r.currency !== "EUR") toast.warning(`Receipt amount: ${r.total ?? "unknown"} ${r.currency}. Enter the EUR amount before saving.`);
      else toast.success("Receipt read — check the amount and set the payment due date");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't read the receipt"); }
    finally { setScanning(false); }
  }

  async function save() {
    const amount = num(f.amount);
    if (!(amount > 0)) return void toast.error("Enter an amount");
    setBusy(true);
    const row = { property_id: propertyId, tax_type: f.tax_type, label: f.label || null, amount, due_date: f.due_date, document_date: f.document_date || null, receipt_path: f.receipt_path };
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
      busy={busy || scanning}
      extraActions={
        tax && (
          <Button type="button" variant="outline" size="lg" className="h-12 rounded-xl" onClick={remove} aria-label="Delete tax">
            <Trash2 className="h-5 w-5" />
          </Button>
        )
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" className="h-12" disabled={scanning} onClick={() => cameraRef.current?.click()}><Camera className="h-4 w-4" /> Take photo</Button>
        <Button type="button" variant="secondary" className="h-12" disabled={scanning} onClick={() => scanRef.current?.click()}><ScanLine className="h-4 w-4" /> {scanning ? "Reading…" : "Scan receipt"}</Button>
      </div>
      <input ref={scanRef} type="file" accept="image/*" hidden onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void onScan(file); }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void onScan(file); }} />
      <Field label="Type">
        <NativeSelect options={TAX_TYPES} value={f.tax_type} onChange={(e) => setF({ ...f, tax_type: e.target.value })} />
      </Field>
      {(
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
      <Field label="Document date">
        <Input className={inputLg} type="date" value={f.document_date} onChange={(e) => setF({ ...f, document_date: e.target.value })} />
      </Field>
      <Field label="Receipt"><ImagePicker value={f.receipt_path} onChange={(path) => setF({ ...f, receipt_path: path })} folder="taxes" label="Attach receipt" /></Field>
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
        receipt_path: tax.receipt_path,
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
