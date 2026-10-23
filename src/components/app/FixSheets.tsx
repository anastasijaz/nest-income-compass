import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormSheet } from "./FormSheet";
import { Field, NativeSelect, inputLg } from "./fields";
import { ImagePicker } from "./ImagePicker";
import { todayISO } from "@/lib/finance";
import { meQuery, membersQuery, propertiesQuery, useRefresh, type Fix } from "@/lib/queries";

const PRIORITIES = { low: "Low", medium: "Medium", high: "High" };
const num = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));

export function FixSheet({ open, onOpenChange, propertyId, fix }: { open: boolean; onOpenChange: (o: boolean) => void; propertyId?: string | undefined; fix?: Fix | undefined }) {
  const refresh = useRefresh();
  const { data: properties = [] } = useQuery(propertiesQuery);
  const { data: members = [] } = useQuery(membersQuery);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ assigned_to: "", property_id: "", title: "", description: "", priority: "medium", estimated_cost: "", photo_path: null as string | null });

  useEffect(() => {
    if (open)
      setF({
        assigned_to: fix?.assigned_to ?? "",
        property_id: fix?.property_id ?? propertyId ?? properties[0]?.id ?? "",
        title: fix?.title ?? "",
        description: fix?.description ?? "",
        priority: fix?.priority ?? "medium",
        estimated_cost: fix?.estimated_cost != null ? String(fix.estimated_cost).replace(".", ",") : "",
        photo_path: fix?.photo_path ?? null,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fix, propertyId]);

  async function save() {
    if (!f.title.trim()) return void toast.error("Add a title");
    if (!f.property_id) return void toast.error("Choose a property");
    setBusy(true);
    const row = {
      property_id: f.property_id,
      title: f.title.trim(),
      description: f.description || null,
      priority: f.priority,
      estimated_cost: f.estimated_cost ? num(f.estimated_cost) : null,
      photo_path: f.photo_path,
      assigned_to: f.assigned_to || null,
    };
    const { error } = fix ? await supabase.from("fixes").update(row).eq("id", fix.id) : await supabase.from("fixes").insert(row);
    setBusy(false);
    if (error) return void toast.error(error.message);
    refresh();
    onOpenChange(false);
  }

  async function remove() {
    if (!fix || !confirm("Delete this fix?")) return;
    await supabase.from("fixes").delete().eq("id", fix.id);
    refresh();
    onOpenChange(false);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={fix ? "Edit fix" : "Add fix"}
      onSubmit={save}
      busy={busy}
      extraActions={
        fix && (
          <Button type="button" variant="outline" size="lg" className="h-12 rounded-xl" onClick={remove} aria-label="Delete fix">
            <Trash2 className="h-5 w-5" />
          </Button>
        )
      }
    >
      {!propertyId && (
        <Field label="Property">
          <NativeSelect options={properties.map((p) => [p.id, p.name] as [string, string])} value={f.property_id} onChange={(e) => setF({ ...f, property_id: e.target.value })} />
        </Field>
      )}
      <Field label="Title">
        <Input className={inputLg} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Leaking kitchen tap" />
      </Field>
      <Field label="Description">
        <Textarea className="bg-card text-base" rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Priority">
          <NativeSelect options={PRIORITIES} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} />
        </Field>
        <Field label="Estimated cost (€)">
          <Input className={inputLg} inputMode="decimal" value={f.estimated_cost} onChange={(e) => setF({ ...f, estimated_cost: e.target.value })} placeholder="0,00" />
        </Field>
      </div>
      <Field label="Assigned to">
        <NativeSelect
          options={[["", "Nobody yet"], ...members.map((m) => [m.user_id, m.display_name || "Member"] as [string, string])]}
          value={f.assigned_to}
          onChange={(e) => setF({ ...f, assigned_to: e.target.value })}
        />
      </Field>
      <Field label="Photo">
        <ImagePicker value={f.photo_path} onChange={(p) => setF({ ...f, photo_path: p })} folder="fixes" />
      </Field>
    </FormSheet>
  );
}

export function CompleteFixSheet({ fix, onOpenChange }: { fix: Fix | null; onOpenChange: (o: boolean) => void }) {
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const [cost, setCost] = useState("");
  const [date, setDate] = useState(todayISO());
  const [receipt, setReceipt] = useState<string | null>(null);
  const { data: members = [] } = useQuery(membersQuery);
  const { data: me = "" } = useQuery(meQuery);
  const [doneBy, setDoneBy] = useState("");
  const [paidBy, setPaidBy] = useState("");

  useEffect(() => {
    if (fix) {
      setDoneBy(me);
      setPaidBy(me);
      setCost(fix.estimated_cost != null ? String(fix.estimated_cost).replace(".", ",") : "");
      setDate(todayISO());
      setReceipt(null);
    }
  }, [fix, me]);

  async function save() {
    if (!fix) return;
    const amount = num(cost);
    if (!(amount >= 0) || cost === "") return void toast.error("Enter the actual cost");
    setBusy(true);
    const { error } = await supabase.from("fixes").update({ status: "done", actual_cost: amount, completed_at: date, completed_by: doneBy || null }).eq("id", fix.id);
    if (!error && amount > 0) {
      const r = await supabase.from("transactions").insert({
        property_id: fix.property_id,
        kind: "cost",
        amount,
        date,
        category: "repairs",
        note: `Fix: ${fix.title}`,
        receipt_path: receipt,
        fix_id: fix.id,
        paid_by: paidBy || null,
      });
      if (r.error) toast.error(r.error.message);
    }
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Fix done — cost recorded");
    refresh();
    onOpenChange(false);
  }

  return (
    <FormSheet open={!!fix} onOpenChange={onOpenChange} title="Mark as done" description={fix?.title} onSubmit={save} busy={busy} submitLabel="Mark done">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Actual cost (€)">
          <Input className={inputLg} inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} autoFocus />
        </Field>
        <Field label="Completed on">
          <Input className={inputLg} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Done by">
          <NativeSelect options={members.map((m) => [m.user_id, m.display_name || "Member"] as [string, string])} value={doneBy} onChange={(e) => setDoneBy(e.target.value)} />
        </Field>
        <Field label="Paid by">
          <NativeSelect options={members.map((m) => [m.user_id, m.display_name || "Member"] as [string, string])} value={paidBy} onChange={(e) => setPaidBy(e.target.value)} />
        </Field>
      </div>
      <Field label="Receipt (optional)">
        <ImagePicker value={receipt} onChange={setReceipt} folder="receipts" label="Attach receipt" />
      </Field>
      <p className="text-sm text-muted-foreground">A repair cost will be added to this property's transactions.</p>
    </FormSheet>
  );
}

export async function reopenFix(fix: Fix) {
  await supabase.from("transactions").delete().eq("fix_id", fix.id);
  return supabase.from("fixes").update({ status: "todo", actual_cost: null, completed_at: null, completed_by: null }).eq("id", fix.id);
}
