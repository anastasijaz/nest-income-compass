import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Property = Tables<"properties">;
export type Transaction = Tables<"transactions">;
export type Fix = Tables<"fixes">;
export type Tax = Tables<"taxes">;
export type Member = Tables<"workspace_members">;
export type Workspace = Tables<"workspaces">;
export type Visit = Tables<"visits">;

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

export const membersQuery = queryOptions({
  queryKey: ["members"],
  queryFn: () => run<Member[]>(supabase.from("workspace_members").select("*").order("joined_at")),
});

export const workspaceQuery = queryOptions({
  queryKey: ["workspace"],
  queryFn: () => run<Workspace>(supabase.from("workspaces").select("*").single()),
});

export const visitsQuery = queryOptions({
  queryKey: ["visits"],
  queryFn: () => run<Visit[]>(supabase.from("visits").select("*").order("start_date")),
});

export const meQuery = queryOptions({
  queryKey: ["me"],
  staleTime: Infinity,
  queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? "",
});

export function memberName(members: Member[], id: string | null | undefined) {
  if (!id) return "";
  return members.find((m) => m.user_id === id)?.display_name || "Former member";
}

export function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}
