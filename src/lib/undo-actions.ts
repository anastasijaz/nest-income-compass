import { supabase } from "@/integrations/supabase/client";
import type { Fix, Tax } from "@/lib/queries";

/** Reopens a finished fix and removes the cost transaction recorded when it was marked done. */
export async function reopenFix(fix: Fix) {
  await supabase.from("transactions").delete().eq("fix_id", fix.id);
  return supabase
    .from("fixes")
    .update({ status: "todo", actual_cost: null, completed_at: null, completed_by: null })
    .eq("id", fix.id);
}

/** Marks a tax as unpaid again and removes the cost transaction recorded when it was paid. */
export async function unpayTax(tax: Tax) {
  await supabase.from("transactions").delete().eq("tax_id", tax.id);
  return supabase.from("taxes").update({ status: "unpaid", paid_at: null }).eq("id", tax.id);
}
