import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Property = Tables<"properties">;
export type Transaction = Tables<"transactions">;
export type Fix = Tables<"fixes">;
export type Tax = Tables<"taxes">;

async function run<T>(p: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw error;
  return data as T;
}

export const propertiesQuery = queryOptions({
  queryKey: ["properties"],
  queryFn: () => run<Property[]>(supabase.from("properties").select("*").order("created_at")),
});

export const transactionsQuery = queryOptions({
  queryKey: ["transactions"],
  queryFn: () =>
    run<Transaction[]>(
      supabase.from("transactions").select("*").order("date", { ascending: false }).order("created_at", { ascending: false }),
    ),
});

export const fixesQuery = queryOptions({
  queryKey: ["fixes"],
  queryFn: () => run<Fix[]>(supabase.from("fixes").select("*").order("created_at", { ascending: false })),
});

export const taxesQuery = queryOptions({
  queryKey: ["taxes"],
  queryFn: () => run<Tax[]>(supabase.from("taxes").select("*").order("due_date")),
});

export function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}
