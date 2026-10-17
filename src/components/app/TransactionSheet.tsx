import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ScanLine, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FormSheet } from "./FormSheet";
import { Field, NativeSelect, inputLg } from "./fields";
import { ImagePicker } from "./ImagePicker";
import { COST_CATEGORIES, INCOME_CATEGORIES, todayISO } from "@/lib/finance";
import { propertiesQuery, useRefresh, type Transaction } from "@/lib/queries";
import { blobToDataUrl, compressImage, uploadImage } from "@/lib/files";
import { parseReceipt } from "@/lib/receipt.functions";

export type TxnKind = "income" | "cost";

export function TransactionSheet({
  open,
  onOpenChange,
  kind,
  propertyId,
  txn,
  startScan,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kind: TxnKind;
  propertyId?: string;
  txn?: Transaction;
  startScan?: boolean;
}) {
  const refresh = useRefresh();
  const scan = useServerFn(parseReceipt);
  const { data: properties = [] } = useQuery(propertiesQuery);
  const scanRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const [f, setF] = useState({
    property_id: "",
    amount: "",
    date: todayISO(),
    category: "",
    vendor: "",
    note: "",
    receipt_path: null as string | null,
    recurring: false,
  });

  useEffect(() => {
    if (!open) return;
    setSuggested(false);
    setF({
      property_id: txn?.property_id ?? propertyId ?? properties[0]?.id ?? "",
      amount: txn ? String(txn.amount).replace(".", ",") : "",
      date: txn?.date ?? todayISO(),
      category: txn?.category ?? (kind === "income" ? "rent" : "repairs"),
      vendor: txn?.vendor ?? "",
      note: txn?.note ?? "",
      receipt_path: txn?.receipt_path ?? null,
      recurring: false,
    });
    if (startScan) setTimeout(() => scanRef.current?.click(), 150);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, txn, kind, propertyId]);

  async function onScan(file: File) {
    setScanning(true);
    try {
      const blob = await compressImage(file);
      const [path, dataUrl] = await Promise.all([uploadImage(blob, "receipts"), blobToDataUrl(blob)]);
      setF((p) => ({ ...p, receipt_path: path }));
      const r = await scan({ data: { image: dataUrl } });
      setF((p) => ({
        ...p,
        receipt_path: path,
        vendor: r.vendor ?? p.vendor,
        date: r.date ?? p.date,
        amount: r.total != null ? r.total.toFixed(2).replace(".", ",") : p.amount,
        category: r.category || p.category,
      }));
      setSuggested(true);
      toast.success("Receipt read — please check the details");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't read the receipt");
    } finally {
      setScanning(false);
    }
  }

  async function save() {
    const amount = Number(f.amount.replace(/\./g, "").replace(",", "."));
    if (!f.property_id) return toast.error("Choose a property");
    if (!(amount > 0)) return toast.error("Enter an amount");
    setBusy(true);
    let error;
    if (!txn && kind === "income" && f.category === "rent" && f.recurring) {
      const day = Math.min(28, Number(f.date.slice(8, 10)));
      ({ error } = await supabase.from("recurring_rents").insert({
        property_id: f.property_id,
        amount,
        day_of_month: day,
        start_date: f.date,
        note: f.note || null,
      }));
      if (!error) ({ error } = await supabase.rpc("generate_recurring_rent"));
    } else {
      const row = {
        property_id: f.property_id,
        kind,
        amount,
        date: f.date,
        category: f.category,
        vendor: kind === "cost" ? f.vendor || null : null,
        note: f.note || null,
        receipt_path: f.receipt_path,
      };
      ({ error } = txn
        ? await supabase.from("transactions").update(row).eq("id", txn.id)
        : await supabase.from("transactions").insert(row));
    }
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(txn ? "Saved" : kind === "income" ? "Income added" : "Cost added");
    refresh();
    onOpenChange(false);
  }

  async function remove() {
    if (!txn || !confirm("Delete this entry?")) return;
    if (txn.recurring_id && confirm("Also stop this recurring rent from being added in future months?")) {
      await supabase.from("recurring_rents").update({ active: false }).eq("id", txn.recurring_id);
    }
    const { error } = await supabase.from("transactions").delete().eq("id", txn.id);
    if (error) return toast.error(error.message);
    refresh();
    onOpenChange(false);
  }

  const isCost = kind === "cost";
  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`${txn ? "Edit" : "Add"} ${isCost ? "cost" : "income"}`}
      onSubmit={save}
      busy={busy || scanning}
      extraActions={
        txn && (
          <Button type="button" variant="outline" size="lg" className="h-12 rounded-xl" onClick={remove} aria-label="Delete">
            <Trash2 className="h-5 w-5" />
          </Button>
        )
      }
    >
      {isCost && (
        <>
          <Button
            type="button"
            variant="secondary"
            className="h-14 w-full rounded-xl text-base"
            onClick={() => scanRef.current?.click()}
            disabled={scanning}
          >
            <ScanLine className="h-5 w-5" />
            {scanning ? "Reading receipt…" : "Scan receipt"}
          </Button>
          <input
            ref={scanRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void onScan(file);
            }}
          />
          {suggested && (
            <p className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" /> Filled from your receipt. Review before saving.
            </p>
          )}
        </>
      )}
      {!propertyId && (
        <Field label="Property">
          <NativeSelect
            options={properties.map((p) => [p.id, p.name] as [string, string])}
            value={f.property_id}
            onChange={(e) => setF({ ...f, property_id: e.target.value })}
          />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (€)">
          <Input className={inputLg} inputMode="decimal" placeholder="0,00" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} autoFocus={!startScan} />
        </Field>
        <Field label="Date">
          <Input className={inputLg} type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        </Field>
      </div>
      <Field label="Category">
        <NativeSelect options={isCost ? COST_CATEGORIES : INCOME_CATEGORIES} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
      </Field>
      {isCost && (
        <Field label="Vendor">
          <Input className={inputLg} value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} placeholder="Who did you pay?" />
        </Field>
      )}
      <Field label="Note">
        <Textarea className="bg-card text-base" rows={2} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
      </Field>
      {!txn && kind === "income" && f.category === "rent" && (
        <label className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
          <span>
            <span className="block font-medium">Repeat every month</span>
            <span className="block text-sm text-muted-foreground">Rent is added automatically each month from this date</span>
          </span>
          <Switch checked={f.recurring} onCheckedChange={(v) => setF({ ...f, recurring: v })} />
        </label>
      )}
      {isCost && (
        <Field label="Receipt">
          <ImagePicker value={f.receipt_path} onChange={(p) => setF({ ...f, receipt_path: p })} folder="receipts" label="Attach receipt" />
        </Field>
      )}
    </FormSheet>
  );
}
