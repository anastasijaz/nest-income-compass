import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Rentwise — Does your rental pay for itself?" },
      {
        name: "description",
        content: "Simple mobile tracker for rental property income, costs, fixes and taxes.",
      },
      { property: "og:title", content: "Rentwise — Does your rental pay for itself?" },
      {
        property: "og:description",
        content: "Simple mobile tracker for rental property income, costs, fixes and taxes.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    throw redirect({ to: data.session ? "/dashboard" : "/auth" });
  },
});
