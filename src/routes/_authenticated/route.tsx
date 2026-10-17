import { useEffect } from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const qc = useQueryClient();
  // Create any missing monthly rent entries from recurring rules.
  useEffect(() => {
    supabase.rpc("generate_recurring_rent").then(({ data }) => {
      if (data && data > 0) qc.invalidateQueries({ queryKey: ["transactions"] });
    });
  }, [qc]);
  return <Outlet />;
}
