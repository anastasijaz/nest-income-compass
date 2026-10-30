import { useEffect } from "react";
import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/app/BottomNav";

// beforeLoad runs on every navigation; only create the group once per signed-in user.
let ensuredFor: string | null = null;

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // getSession reads the locally stored (auto-refreshed) session, so tab switches don't wait on the network.
    // Data access is still enforced server-side by RLS.
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) throw redirect({ to: "/auth" });
    // Every user belongs to a shared group; create one on first visit.
    if (ensuredFor !== user.id) {
      const { error } = await supabase.rpc("ensure_workspace");
      if (!error) ensuredFor = user.id;
    }
    return { user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const qc = useQueryClient();
  const pathname = useLocation({ select: (l) => l.pathname });
  // Create any missing monthly rent entries from recurring rules.
  useEffect(() => {
    supabase.rpc("generate_recurring_rent").then(({ data }) => {
      if (data && data > 0) qc.invalidateQueries({ queryKey: ["transactions"] });
    });
  }, [qc]);
  return (
    <div className="pb-[calc(var(--nav-h)+env(safe-area-inset-bottom))]">
      <Outlet />
      <BottomNav pathname={pathname} />
    </div>
  );
}
