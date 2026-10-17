import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, inputLg } from "@/components/app/fields";
import hero from "@/assets/auth-hero.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Rentwise" },
      { name: "description", content: "Sign in to track your rental properties." },
      { property: "og:title", content: "Sign in — Rentwise" },
      { property: "og:description", content: "Sign in to track your rental properties." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return void toast.error(error.message);
      navigate({ to: "/dashboard" });
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      setBusy(false);
      if (error) return void toast.error(error.message);
      if (data.session) navigate({ to: "/dashboard" });
      else setSent(true);
    }
  }

  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <div className="relative h-48 overflow-hidden md:h-auto">
        <img src={hero} alt="" width={1024} height={1280} className="h-full w-full object-cover" />
      </div>
      <div className="flex items-start justify-center px-6 py-10 md:items-center">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold">Rentwise</h1>
          <p className="mt-2 text-muted-foreground">See what each rental earns — and whether it covers its costs.</p>
          {sent ? (
            <div className="mt-8 rounded-2xl border bg-card p-5">
              <p className="font-medium">Check your email</p>
              <p className="mt-1 text-sm text-muted-foreground">We sent a confirmation link to {email}. Open it to finish signing up.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-4">
              <Field label="Email">
                <Input className={inputLg} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="Password">
                <Input
                  className={inputLg}
                  type="password"
                  autoComplete={mode === "in" ? "current-password" : "new-password"}
                  minLength={6}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Button type="submit" size="lg" className="h-12 w-full rounded-xl text-base" disabled={busy}>
                {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
              </Button>
              <button type="button" className="w-full py-2 text-sm text-muted-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
                {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
