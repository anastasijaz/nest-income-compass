import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormSheet } from "./FormSheet";
import { Field, NativeSelect, inputLg } from "./fields";
import { ImagePicker } from "./ImagePicker";
import { PROPERTY_TYPES } from "@/lib/finance";
import { COUNTRIES, countryOptions } from "@/lib/countries";
import { useRefresh, type Property } from "@/lib/queries";

export function PropertySheet({
  open,
  onOpenChange,
  property,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  property?: Property;
}) {
  const refresh = useRefresh();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", address: "", country: "", property_type: "apartment", monthly_rent: "", tenants: "0", photo_path: null as string | null });

  useEffect(() => {
    if (open)
      setF({
        name: property?.name ?? "",
        address: property?.address ?? "",
        country: property?.country ?? "",
        property_type: property?.property_type ?? "apartment",
        monthly_rent: property ? String(property.monthly_rent) : "",
        tenants: String(property?.tenants ?? 0),
        photo_path: property?.photo_path ?? null,
      });
  }, [open, property]);

  async function save() {
    if (!f.name.trim()) return void toast.error("Give the property a name");
    setBusy(true);
    const row = {
      name: f.name.trim(),
      address: f.address.trim(),
      country: f.country.trim() || null,
      property_type: f.property_type,
      monthly_rent: Number(f.monthly_rent.replace(",", ".")) || 0,
      tenants: Number(f.tenants) || 0,
      photo_path: f.photo_path,
    };
    const { error } = property
      ? await supabase.from("properties").update(row).eq("id", property.id)
      : await supabase.from("properties").insert(row);
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success(property ? "Property updated" : "Property added");
    refresh();
    onOpenChange(false);
  }

  async function remove() {
    if (!property || !confirm(`Delete ${property.name} and all its records?`)) return;
    const { error } = await supabase.from("properties").delete().eq("id", property.id);
    if (error) return void toast.error(error.message);
    refresh();
    onOpenChange(false);
    navigate({ to: "/dashboard" });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={property ? "Edit property" : "Add property"}
      onSubmit={save}
      busy={busy}
      extraActions={
        property && (
          <Button type="button" variant="outline" size="lg" className="h-12 rounded-xl" onClick={remove} aria-label="Delete property">
            <Trash2 className="h-5 w-5" />
          </Button>
        )
      }
    >
      <ImagePicker value={f.photo_path} onChange={(p) => setF({ ...f, photo_path: p })} folder="properties" />
      <Field label="Name / nickname">
        <Input className={inputLg} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Altbau Kreuzberg" />
      </Field>
      <Field label="Address">
        <Input className={inputLg} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Street, city" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Country">
          <NativeSelect options={countryChoices(f.country)} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} />
        </Field>
        <Field label="Type">
          <NativeSelect options={PROPERTY_TYPES} value={f.property_type} onChange={(e) => setF({ ...f, property_type: e.target.value })} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Monthly rent (€)">
          <Input className={inputLg} inputMode="decimal" value={f.monthly_rent} onChange={(e) => setF({ ...f, monthly_rent: e.target.value })} placeholder="0,00" />
        </Field>
        <Field label="Tenants">
          <Input className={inputLg} type="number" min={0} value={f.tenants} onChange={(e) => setF({ ...f, tenants: e.target.value })} />
        </Field>
      </div>
    </FormSheet>
  );
}
